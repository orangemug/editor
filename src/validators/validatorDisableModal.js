export default function (modals) {
  return (props) => {
    const overrides = {};
    modals.forEach(modal => {
      if (props.isOpen[modal]) {
        console.warn(`Warning: disabled '${modal}' modal in open state, this probably means there is some UI trying to set it's state.`);
      }
      overrides[modal] = false;
    });

    return {
      ...props,
      isOpen: {
        ...props.isOpen,
        ...overrides,
      }
    };
  }
}
