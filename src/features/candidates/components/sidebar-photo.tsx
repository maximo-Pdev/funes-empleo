import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound } from "lucide-react";

export function CandidateSidebarPhoto({ photo, name }: { photo: { id: string } | null; name: string }) {
  return <span data-slot="sidebar-photo">
    <Avatar className="!size-11 shrink-0">
      {photo && <AvatarImage key={photo.id} src={`/api/candidate/photo/${photo.id}`} alt={`Foto de ${name}`} />}
      <AvatarFallback role="img" aria-label={photo ? `Foto no disponible de ${name}` : "Foto de perfil de ejemplo"}>
        <UserRound className="h-6 w-6" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  </span>;
}
