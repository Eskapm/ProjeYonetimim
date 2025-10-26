import { ContactCard } from '../contact-card';

export default function ContactCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <ContactCard
        id="1"
        name="Aydın İnşaat Ltd. Şti."
        contactPerson="Mehmet Aydın"
        phone="+90 532 123 45 67"
        email="mehmet@aydininsaat.com"
        address="Kadıköy, İstanbul"
        specialty="Kaba İmalat"
        type="subcontractor"
        onEdit={() => console.log('Edit subcontractor')}
        onDelete={() => console.log('Delete subcontractor')}
      />
      <ContactCard
        id="2"
        name="Yılmaz Holding A.Ş."
        contactPerson="Ahmet Yılmaz"
        phone="+90 216 555 66 77"
        email="a.yilmaz@yilmazholding.com"
        address="Ataşehir, İstanbul"
        type="customer"
        onEdit={() => console.log('Edit customer')}
        onDelete={() => console.log('Delete customer')}
      />
      <ContactCard
        id="3"
        name="Elektrik Sistemleri A.Ş."
        contactPerson="Can Demir"
        phone="+90 541 789 01 23"
        email="can@elektriksistem.com"
        address="Beykoz, İstanbul"
        specialty="Elektrik Tesisat"
        type="subcontractor"
        onEdit={() => console.log('Edit subcontractor')}
        onDelete={() => console.log('Delete subcontractor')}
      />
    </div>
  );
}
