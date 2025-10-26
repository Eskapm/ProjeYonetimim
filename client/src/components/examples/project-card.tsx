import { ProjectCard } from '../project-card';

export default function ProjectCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <ProjectCard
        id="1"
        name="Ataşehir Konut Projesi"
        location="İstanbul, Ataşehir"
        area="2,500"
        startDate="01.01.2024"
        endDate="31.12.2024"
        status="Devam Ediyor"
        costPerSqm="₺4,250"
        onView={() => console.log('View project')}
        onEdit={() => console.log('Edit project')}
      />
      <ProjectCard
        id="2"
        name="Beykoz Villa İnşaatı"
        location="İstanbul, Beykoz"
        area="850"
        startDate="15.03.2024"
        endDate="15.09.2024"
        status="Planlama"
        costPerSqm="₺6,800"
        onView={() => console.log('View project')}
        onEdit={() => console.log('Edit project')}
      />
      <ProjectCard
        id="3"
        name="Maltepe Ofis Binası"
        location="İstanbul, Maltepe"
        area="3,200"
        startDate="01.06.2023"
        endDate="30.11.2023"
        status="Tamamlandı"
        costPerSqm="₺5,150"
        onView={() => console.log('View project')}
        onEdit={() => console.log('Edit project')}
      />
    </div>
  );
}
