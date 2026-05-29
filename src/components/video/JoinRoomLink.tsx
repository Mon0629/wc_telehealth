import { Link } from "react-router"

interface JoinRoomLinkProps {
  appointmentId: number
  canJoin: boolean
}

export function JoinRoomLink({ appointmentId, canJoin }: JoinRoomLinkProps) {
  if (!canJoin) {
    return <span className="text-sm text-zinc-400">—</span>
  }

  return (
    <Link
      to={`/call/${appointmentId}`}
      className="text-sm font-medium text-zinc-900 hover:underline"
    >
      Join Room
    </Link>
  )
}
