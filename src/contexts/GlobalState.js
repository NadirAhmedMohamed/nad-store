import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
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

  // Always keep the latest application state available.
  const stateRef = useRef(state);

  // Track the basket snapshot already saved successfully.
  const persistedBasketRef = useRef(null);

  // Serialize basket operations to prevent conflicting writes.
  const basketQueueRef = useRef(Promise.resolve());

  stateRef.current = state;

  // Background synchronization for legacy direct dispatch operations.
  useEffect(() => {
    const currentUser = state.user;

    if (!currentUser?.uid || !state.isBasketReady) return;

    const uid = currentUser.uid;
    const basketSnapshot = JSON.stringify(state.basket);
    const syncKey = `${uid}:${basketSnapshot}`;

    if (persistedBasketRef.current === syncKey) return;

    const syncBasket = async () => {
      try {
        localStorage.setItem(`basket_${uid}`, basketSnapshot);

        await setDoc(
          doc(db, "users", uid),
          { basket: state.basket },
          { merge: true },
        );

        persistedBasketRef.current = syncKey;
      } catch (error) {
        console.error("Basket synchronization failed:", error);
      }
    };

    syncBasket();
  }, [state.basket, state.user, state.isBasketReady]);

  // Centralized basket operation handler.
  const runBasketOperation = (action) => {
    const operation = async () => {
      const currentState = stateRef.current;
      const currentUserId = currentState.user?.uid || null;

      // Do not modify an authenticated basket before it is loaded.
      if (currentUserId && !currentState.isBasketReady) {
        throw new Error("Your basket is still loading. Please try again.");
      }

      // Calculate the next state without updating the UI yet.
      const nextState = AppReducer(currentState, action);

      // No change means the requested operation was unnecessary.
      if (nextState === currentState) {
        return false;
      }

      const nextBasket = nextState.basket;
      const basketSnapshot = JSON.stringify(nextBasket);

      // Save authenticated customers' baskets before committing UI changes.
      if (currentUserId) {
        await setDoc(
          doc(db, "users", currentUserId),
          { basket: nextBasket },
          { merge: true },
        );

        // Make sure the user session did not change during the request.
        const latestState = stateRef.current;

        if (
          latestState.user?.uid !== currentUserId ||
          !latestState.isBasketReady
        ) {
          throw new Error(
            "Your session changed. Please try the operation again.",
          );
        }

        persistedBasketRef.current = `${currentUserId}:${basketSnapshot}`;

        try {
          localStorage.setItem(`basket_${currentUserId}`, basketSnapshot);
        } catch (error) {
          console.error("Could not save basket locally:", error);
        }
      } else {
        // Prevent a guest operation from updating a newly signed-in user's UI.
        if (stateRef.current.user?.uid) {
          throw new Error("Your session changed. Please try again.");
        }
      }

      // Update the local state only after persistence succeeds.
      stateRef.current = nextState;

      dispatch({
        type: "SET_BASKET",
        basket: nextBasket,
      });

      return true;
    };

    // Queue this operation behind all previously requested operations.
    const queuedOperation = basketQueueRef.current.then(operation, operation);

    // Keep the queue alive even if one operation fails.
    basketQueueRef.current = queuedOperation.catch(() => {});

    return queuedOperation;
  };

  // Add a product to the basket.
  const addToBasket = (item) => {
    if (!item || item.id === undefined || item.id === null) {
      return Promise.reject(new Error("Invalid product information."));
    }

    return runBasketOperation({
      type: "ADD_TO_BASKET",
      item,
    });
  };

  // Update an existing product quantity.
  const updateBasketQuantity = (id, quantity) => {
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
  };

  // Remove a product from the basket.
  const removeFromBasket = (id) => {
    if (id === undefined || id === null) {
      return Promise.reject(new Error("Invalid product information."));
    }

    return runBasketOperation({
      type: "REMOVE_FROM_BASKET",
      id,
    });
  };

  // Empty the entire basket.
  const emptyBasket = () => {
    return runBasketOperation({
      type: "EMPTY_BASKET",
    });
  };

  return (
    <GlobalContext.Provider
      value={{
        user: state.user,
        basket: state.basket,
        isBasketReady: state.isBasketReady,

        // Keep dispatch for authentication and basket initialization.
        dispatch,

        // Centralized basket operations.
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

// Custom Hook
export const useAuth = () => {
  return useContext(GlobalContext);
};
