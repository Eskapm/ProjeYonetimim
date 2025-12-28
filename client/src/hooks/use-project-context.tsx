import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Project } from "@shared/schema";

interface ProjectContextType {
  activeProject: Project | null;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  clearActiveProject: () => void;
  projects: Project[];
  isLoadingProjects: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = "eska_active_project_id";

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const activeProject = activeProjectId 
    ? projects.find(p => p.id === activeProjectId) || null 
    : null;

  const setActiveProjectId = (id: string | null) => {
    setActiveProjectIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearActiveProject = () => {
    setActiveProjectId(null);
  };

  useEffect(() => {
    if (activeProjectId && projects.length > 0) {
      const projectExists = projects.some(p => p.id === activeProjectId);
      if (!projectExists) {
        clearActiveProject();
      }
    }
  }, [activeProjectId, projects]);

  return (
    <ProjectContext.Provider
      value={{
        activeProject,
        activeProjectId,
        setActiveProjectId,
        clearActiveProject,
        projects,
        isLoadingProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
}
