import { Link } from "react-router"

interface JoinRoomLinkProps {
  appointmentId: number
  canJoin: boolean
}

export function JoinRoomLink({ appointmentId, canJoin }: JoinRoomLinkProps) {
  if (!canJoin) {
    return <span className="text-sm text-slate-400">—</span>
  }

  return (
    <Link
      to={`/call/${appointmentId}`}
      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
    >
      Join Room
    </Link>
  )
}
