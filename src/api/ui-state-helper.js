export default function uiStateHelper (state, setState) {
  function changeMapState (mapState) {
    setState({
      ...state,
      mapState,
    })
  }

  function toggleModal (modalName) {
    const isOpen = {};
    setState({
      ...state,
      isOpen: {
        ...state.isOpen,
        [modalName]: !state.isOpen[modalName],
      }
    })
  }
  
  function setModalState (modalName, isModalOpen=true) {
    const isOpen = {};
    setState({
      ...state,
      isOpen: {
        ...state.isOpen,
        [modalName]: isModalOpen,
      }
    })
  }

  function openModal(modalName) {
    setModalState(modalName, true);
  }

  return {
    changeMapState,
    toggleModal,
    setModalState,
    openModal,
  };
}
