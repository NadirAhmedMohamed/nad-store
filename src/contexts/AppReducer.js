const fallbackState = {
  basket: [],
  user: null,
  isBasketReady: false,
};

export const getBasketTotalPrice = (basket = []) => {
  return basket.reduce((total, item) => {
    const price = Number(item.price) || 0;
    const quantity = Math.max(1, Number(item.quantity) || 1);

    return total + price * quantity;
  }, 0);
};

export default function AppReducer(state = fallbackState, action) {
  switch (action.type) {
    case "SET_USER": {
      const nextUser = action.user;

      const sameUser =
        state.user?.uid && nextUser?.uid && state.user.uid === nextUser.uid;

      return {
        ...state,
        user: nextUser,
        basket: sameUser ? state.basket : [],
        isBasketReady: sameUser ? state.isBasketReady : false,
      };
    }

    case "REMOVE_USER": {
      return {
        ...state,
        user: null,
        basket: [],
        isBasketReady: false,
      };
    }

    case "SET_BASKET": {
      return {
        ...state,
        basket: Array.isArray(action.basket) ? action.basket : [],
      };
    }

    case "ADD_TO_BASKET": {
      const newItem = action.item;

      if (!newItem || newItem.id === undefined || newItem.id === null) {
        return state;
      }

      const addedQuantity = Math.max(
        1,
        Math.floor(Number(newItem.quantity) || 1),
      );

      const existingItem = state.basket.find(
        (item) => String(item.id) === String(newItem.id),
      );

      if (existingItem) {
        return {
          ...state,
          basket: state.basket.map((item) =>
            String(item.id) === String(newItem.id)
              ? {
                  ...item,
                  quantity:
                    Math.max(1, Number(item.quantity) || 1) + addedQuantity,
                }
              : item,
          ),
        };
      }

      return {
        ...state,
        basket: [
          ...state.basket,
          {
            ...newItem,
            quantity: addedQuantity,
          },
        ],
      };
    }

    case "UPDATE_BASKET_QUANTITY": {
      const { id, quantity } = action;

      const parsedQuantity = Number(quantity);

      if (
        !Number.isFinite(parsedQuantity) ||
        !Number.isInteger(parsedQuantity) ||
        parsedQuantity < 1
      ) {
        return state;
      }

      const exists = state.basket.some(
        (item) => String(item.id) === String(id),
      );

      if (!exists) return state;

      const currentItem = state.basket.find(
        (item) => String(item.id) === String(id),
      );

      if (Number(currentItem.quantity) === parsedQuantity) {
        return state;
      }

      return {
        ...state,
        basket: state.basket.map((item) =>
          String(item.id) === String(id)
            ? {
                ...item,
                quantity: parsedQuantity,
              }
            : item,
        ),
      };
    }

    case "REMOVE_FROM_BASKET": {
      const exists = state.basket.some(
        (item) => String(item.id) === String(action.id),
      );

      if (!exists) return state;

      return {
        ...state,
        basket: state.basket.filter(
          (item) => String(item.id) !== String(action.id),
        ),
      };
    }

    case "EMPTY_BASKET": {
      if (state.basket.length === 0) return state;

      return {
        ...state,
        basket: [],
      };
    }

    case "SET_BASKET_READY": {
      return {
        ...state,
        isBasketReady: Boolean(action.value),
      };
    }

    default: {
      return state;
    }
  }
}
