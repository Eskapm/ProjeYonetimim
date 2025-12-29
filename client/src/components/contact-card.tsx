import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Mail, Phone, MapPin, Edit, Trash2, User, Users, Eye } from "lucide-react";
import type { ContactPerson } from "@shared/schema";

interface ContactCardProps {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  specialty?: string;
  supplierType?: string;
  contacts?: ContactPerson[];
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
  supplierType,
  contacts = [],
  type,
  onEdit,
  onDelete,
}: ContactCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasContacts = contacts && contacts.length > 0;
  const typeLabel = type === "subcontractor" ? "Taşeron/Tedarikçi" : "Müşteri";

  return (
    <>
    <Card className="hover-elevate cursor-pointer" data-testid={`card-${type}-${id}`} onClick={() => setDetailOpen(true)}>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg truncate">{name}</CardTitle>
              {supplierType && (
                <Badge variant="secondary" className="text-xs">
                  {supplierType}
                </Badge>
              )}
            </div>
            {contactPerson && !hasContacts && (
              <p className="text-sm text-muted-foreground truncate">{contactPerson}</p>
            )}
            {specialty && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{specialty}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
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

        {hasContacts && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">İletişim Kişileri ({contacts.length})</span>
            </div>
            <div className="space-y-2">
              {contacts.slice(0, 3).map((contact, index) => (
                <div key={index} className="flex items-center gap-2 text-sm pl-6">
                  <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">
                    {contact.name}
                    {contact.title && <span className="text-muted-foreground"> - {contact.title}</span>}
                  </span>
                </div>
              ))}
              {contacts.length > 3 && (
                <p className="text-xs text-muted-foreground pl-6">
                  +{contacts.length - 3} kişi daha...
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => { e.stopPropagation(); setDetailOpen(true); }}
          data-testid={`button-view-${type}-${id}`}
        >
          <Eye className="h-4 w-4 mr-2" />
          Detay
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
          data-testid={`button-edit-${type}-${id}`}
        >
          <Edit className="h-4 w-4 mr-2" />
          Düzenle
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          data-testid={`button-delete-${type}-${id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>

    {/* Detail Dialog */}
    <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <span>{name}</span>
              {supplierType && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {supplierType}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {specialty && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Uzmanlık Alanı</h4>
              <p className="text-sm">{specialty}</p>
            </div>
          )}
          
          {contactPerson && !hasContacts && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">İletişim Kişisi</h4>
              <p className="text-sm">{contactPerson}</p>
            </div>
          )}
          
          {phone && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Telefon</h4>
              <p className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {phone}
              </p>
            </div>
          )}
          
          {email && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">E-posta</h4>
              <p className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {email}
              </p>
            </div>
          )}
          
          {address && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Adres</h4>
              <p className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {address}
              </p>
            </div>
          )}
          
          {hasContacts && (
            <div className="pt-2 border-t">
              <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                İletişim Kişileri ({contacts.length})
              </h4>
              <div className="space-y-3">
                {contacts.map((contact, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{contact.name}</span>
                      {contact.title && (
                        <Badge variant="outline" className="text-xs">{contact.title}</Badge>
                      )}
                    </div>
                    {contact.phone && (
                      <p className="text-sm text-muted-foreground ml-6 flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {contact.phone}
                      </p>
                    )}
                    {contact.email && (
                      <p className="text-sm text-muted-foreground ml-6 flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {contact.email}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => { setDetailOpen(false); onEdit?.(); }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Düzenle
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDetailOpen(false)}
          >
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
