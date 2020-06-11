export default function uiStateHelper (state, setState) {
  return {
    changeMapState: (mapState) => {
      setState({
        ...state,
        mapState,
      })
    },
    toggleModal: (modalName) => {
      const isOpen = {};
      setState({
        ...state,
        isOpen: {
          ...state.isOpen,
          [modalName]: !state.isOpen[modalName],
        }
      })
    },
    openModal: (modalName, isModalOpen=true) => {
      const isOpen = {};
      setState({
        ...state,
        isOpen: {
          ...state.isOpen,
          [modalName]: isModalOpen,
        }
      })
    },
  };
}
