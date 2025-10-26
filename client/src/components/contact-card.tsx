import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, MapPin, Edit, Trash2 } from "lucide-react";

interface ContactCardProps {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  specialty?: string;
  type: "subcontractor" | "customer";
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ContactCard({
  id,
  name,
  contactPerson,
  phone,
  email,
  address,
  specialty,
  type,
  onEdit,
  onDelete,
}: ContactCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover-elevate" data-testid={`card-${type}-${id}`}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{name}</CardTitle>
            {contactPerson && (
              <p className="text-sm text-muted-foreground truncate">{contactPerson}</p>
            )}
            {specialty && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{specialty}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {address && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{address}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onEdit}
          data-testid={`button-edit-${type}-${id}`}
        >
          <Edit className="h-4 w-4 mr-2" />
          Düzenle
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex-1"
          onClick={onDelete}
          data-testid={`button-delete-${type}-${id}`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Sil
        </Button>
      </CardFooter>
    </Card>
  );
}
