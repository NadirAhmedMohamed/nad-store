import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
} from "react";

import AppReducer from "./AppReducer";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase.config.js";

export const initialState = {
  basket: [],
  user: null,
  isBasketReady: false,
};

const GlobalContext = createContext(null);

export const GlobalProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  const stateRef = useRef(state);
  const basketQueueRef = useRef(Promise.resolve());
  const sessionVersionRef = useRef(0);

  stateRef.current = state;

  // Start a new isolated basket session.
  const beginBasketSession = useCallback((user) => {
    const sessionVersion = ++sessionVersionRef.current;

    const nextState = AppReducer(stateRef.current, {
      type: "BEGIN_BASKET_SESSION",
      user,
    });

    stateRef.current = nextState;

    dispatch({
      type: "BEGIN_BASKET_SESSION",
      user,
    });

    return sessionVersion;
  }, []);

  // Initialize the basket for the current session.
  const initializeBasket = useCallback((uid, basket, sessionVersion) => {
    if (
      sessionVersionRef.current !== sessionVersion ||
      stateRef.current.user?.uid !== uid
    ) {
      return false;
    }

    const safeBasket = Array.isArray(basket) ? basket : [];

    let nextState = AppReducer(stateRef.current, {
      type: "SET_BASKET",
      basket: safeBasket,
    });

    nextState = AppReducer(nextState, {
      type: "SET_BASKET_READY",
      value: true,
    });

    stateRef.current = nextState;

    dispatch({
      type: "SET_BASKET",
      basket: safeBasket,
    });

    dispatch({
      type: "SET_BASKET_READY",
      value: true,
    });

    return true;
  }, []);

  // End the current session.
  const endBasketSession = useCallback(() => {
    ++sessionVersionRef.current;

    let nextState = AppReducer(stateRef.current, {
      type: "SET_USER",
      user: null,
    });

    nextState = AppReducer(nextState, {
      type: "SET_BASKET_READY",
      value: true,
    });

    stateRef.current = nextState;

    dispatch({
      type: "SET_USER",
      user: null,
    });

    dispatch({
      type: "SET_BASKET_READY",
      value: true,
    });
  }, []);

  // Serialize all basket operations.
  const runBasketOperation = useCallback((action) => {
    const requestedUserId = stateRef.current.user?.uid || null;
    const requestedSessionVersion = sessionVersionRef.current;

    const operation = async () => {
      const currentState = stateRef.current;

      // Reject operations from outdated sessions.
      if (
        sessionVersionRef.current !== requestedSessionVersion ||
        (currentState.user?.uid || null) !== requestedUserId
      ) {
        throw new Error(
          "Your session changed. Please try the operation again.",
        );
      }

      if (requestedUserId && !currentState.isBasketReady) {
        throw new Error("Your basket is still loading. Please try again.");
      }

      const nextState = AppReducer(currentState, action);

      if (nextState === currentState) {
        return false;
      }

      const nextBasket = nextState.basket;
      const basketSnapshot = JSON.stringify(nextBasket);

      if (requestedUserId) {
        // Save the basket to the authenticated user's document.
        await setDoc(
          doc(db, "users", requestedUserId),
          { basket: nextBasket },
          { merge: true },
        );

        // Verify that the session is still the same.
        if (
          sessionVersionRef.current !== requestedSessionVersion ||
          stateRef.current.user?.uid !== requestedUserId ||
          !stateRef.current.isBasketReady
        ) {
          throw new Error(
            "Your session changed. Please try the operation again.",
          );
        }

        try {
          localStorage.setItem(`basket_${requestedUserId}`, basketSnapshot);
        } catch (error) {
          console.error("Could not save basket locally:", error);
        }
      } else {
        // Keep guest basket data separate.
        if (
          sessionVersionRef.current !== requestedSessionVersion ||
          stateRef.current.user?.uid
        ) {
          throw new Error("Your session changed. Please try again.");
        }

        try {
          localStorage.setItem("basket_guest", basketSnapshot);
        } catch (error) {
          console.error("Could not save guest basket:", error);
        }
      }

      stateRef.current = nextState;

      dispatch({
        type: "SET_BASKET",
        basket: nextBasket,
      });

      return true;
    };

    const queuedOperation = basketQueueRef.current.then(operation, operation);

    basketQueueRef.current = queuedOperation.catch(() => {});

    return queuedOperation;
  }, []);

  // Add a product.
  const addToBasket = useCallback(
    (item) => {
      if (!item || item.id === undefined || item.id === null) {
        return Promise.reject(new Error("Invalid product information."));
      }

      return runBasketOperation({
        type: "ADD_TO_BASKET",
        item,
      });
    },
    [runBasketOperation],
  );

  // Update product quantity.
  const updateBasketQuantity = useCallback(
    (id, quantity) => {
      if (id === undefined || id === null) {
        return Promise.reject(new Error("Invalid product information."));
      }

      const parsedQuantity = Number(quantity);

      if (
        !Number.isFinite(parsedQuantity) ||
        !Number.isInteger(parsedQuantity) ||
        parsedQuantity < 1
      ) {
        return Promise.reject(new Error("Please enter a valid quantity."));
      }

      return runBasketOperation({
        type: "UPDATE_BASKET_QUANTITY",
        id,
        quantity: parsedQuantity,
      });
    },
    [runBasketOperation],
  );

  // Remove a product.
  const removeFromBasket = useCallback(
    (id) => {
      if (id === undefined || id === null) {
        return Promise.reject(new Error("Invalid product information."));
      }

      return runBasketOperation({
        type: "REMOVE_FROM_BASKET",
        id,
      });
    },
    [runBasketOperation],
  );

  // Empty the basket.
  const emptyBasket = useCallback(() => {
    return runBasketOperation({
      type: "EMPTY_BASKET",
    });
  }, [runBasketOperation]);

  return (
    <GlobalContext.Provider
      value={{
        user: state.user,
        basket: state.basket,
        isBasketReady: state.isBasketReady,

        dispatch,

        beginBasketSession,
        initializeBasket,
        endBasketSession,

        addToBasket,
        updateBasketQuantity,
        removeFromBasket,
        emptyBasket,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(GlobalContext);
};
