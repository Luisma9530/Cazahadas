import { Outlet, useNavigate } from "react-router-dom";
import socket from "../socket";
import useBoardStore from "../store/BoardStore";
import { useGameStore } from "../store/GameStore";
import { useModalStore } from "../store/ModalStore";
import { usePointStore } from "../store/PointsStore";
import useTurnStore from "../store/TurnStore";
import useNeoHandStore from "../store/NeoHandStore";



export default function DefaultLayout() {

  const navigate = useNavigate()
  const [resetBoardStore] = useBoardStore((state) => [state.resetStore]) //Modificada
  const [resetGameStore] = useGameStore((state) => [state.resetStore]) //Sirve
  const [resetPointsStore] = usePointStore((state) => [state.resetStore]) //Modificada
  const [resetTurnStore] = useTurnStore((state) => [state.resetStore]) //Sirve
  const [resetModalStore] = useModalStore((state) => [state.resetStore])//Sirve
  const [resetNeoHandStore] = useNeoHandStore((state) => [state.resetStore])//Modificada


  const resetAllStores = () => {
    resetBoardStore()
    resetGameStore()
    resetPointsStore()
    resetTurnStore()
    resetModalStore()
    resetNeoHandStore()
  }


  const handleTitleClick = () => {
    socket.disconnect()
    resetAllStores()
    navigate('/')
  }




  return (
    <div className="h-full overflow-x-hidden overflow-y-hidden">
      <div className="flex flex-col justify-center items-center mt-2 h-full w-full">
        <h1 className="font-light z-50 text-5xl hover:cursor-pointer font-title" onClick={handleTitleClick}>Cazahadas</h1>
        <Outlet />
      </div>
    </div>
  )
}