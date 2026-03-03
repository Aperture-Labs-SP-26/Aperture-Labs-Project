"use client";

/**
 * Page for creating new projects and viewing all projects.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, X, ArrowRight, FolderOpen, AlertCircle } from "lucide-react";
import { useApp, Project } from "@/app/AppProvider";
import { listProjects, createProject, uploadDesignSpec, API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function apiProjectToAppProject(p: {
    id: string;
    name: string;
    created_at: string;
    design_specs: Array<{ filename: string }>;
}): Project & { createdAt: string; updatedAt: string; designSpecs: string[] } {
    return {
        id: p.id,
        name: p.name,
        createdAt: typeof p.created_at === "string" ? p.created_at : new Date(p.created_at).toISOString(),
        updatedAt: typeof p.created_at === "string" ? p.created_at : new Date(p.created_at).toISOString(),
        designSpecs: p.design_specs?.map((s) => s.filename) ?? [],
    };
}

export default function ProjectsPage() {
    const router = useRouter();
    const { setCurrentProject } = useApp();

    const [existingProjects, setExistingProjects] = useState<
        Array<Project & { createdAt: string; updatedAt: string; designSpecs: string[] }>
    >([]);
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [projectsError, setProjectsError] = useState<string | null>(null);

    const [projectName, setProjectName] = useState<string>("");
    const [designSpecs, setDesignSpecs] = useState<File[]>([]);
    const [showNewProject, setShowNewProject] = useState<boolean>(false);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        listProjects()
            .then((res) => {
                if (!cancelled) {
                    setExistingProjects(res.projects.map(apiProjectToAppProject));
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setProjectsError(err instanceof Error ? err.message : "Failed to load projects");
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoadingProjects(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const hasProjects = existingProjects.length > 0;

    const handleDesignSpecUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setDesignSpecs((prev) => {
                const existingNames = new Set(prev.map((f) => f.name));
                const uniqueNewFiles = newFiles.filter((file) => !existingNames.has(file.name));
                return [...prev, ...uniqueNewFiles];
            });
            // Reset the input so the same file can be selected again if needed
            e.target.value = "";
        }
    };

    const removeDesignSpec = (index: number) => {
        setDesignSpecs((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCreateProject = async () => {
        if (!projectName.trim() || designSpecs.length === 0) return;
        setIsCreating(true);
        setCreateError(null);
        try {
            const created = await createProject(projectName.trim());
            const uploadedFilenames: string[] = [];
            for (const file of designSpecs) {
                try {
                    await uploadDesignSpec(created.id, file);
                    uploadedFilenames.push(file.name);
                } catch (e) {
                    console.warn("Design spec upload failed:", file.name, e);
                }
            }
            if (uploadedFilenames.length < designSpecs.length) {
                alert(
                    "Project created, but some design specs failed to upload. Ensure MinIO is running (docker compose up -d)."
                );
            }
            const appProject = apiProjectToAppProject({
                ...created,
                design_specs: uploadedFilenames.map((f) => ({ filename: f, object_key: "", uploaded_at: "" })),
            });
            setCurrentProject(appProject as unknown as Project);
            router.push("/inspect");
        } catch (err) {
            setCreateError(err instanceof Error ? err.message : "Failed to create project");
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectProject = (
        project: Project & { createdAt: string; updatedAt: string; designSpecs: string[] }
    ) => {
        setCurrentProject(project as unknown as Project);
        router.push("/inspect");
    };

    const showList = !showNewProject && hasProjects;
    const showCreateForm = showNewProject || (!hasProjects && !isLoadingProjects);

    return (
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 transition-colors overflow-hidden">
            {isLoadingProjects ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-slate-600 dark:text-zinc-400">Loading projects...</p>
                </div>
            ) : projectsError ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 max-w-md">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{projectsError}</p>
                    </div>
                    <p className="mt-4 text-sm text-slate-500 dark:text-zinc-500">
                        Ensure the backend is running at {API_BASE_URL}.
                    </p>
                </div>
            ) : showList ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="max-w-[1200px] w-full mx-auto px-6 pt-6 pb-2 flex-shrink-0">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                                Project Setup
                            </h1>
                            <p className="text-slate-600 dark:text-zinc-400">
                                Select an existing project or create a new one
                            </p>
                        </div>
                        <div className="max-w-[800px] mx-auto">
                            {/* Header with Your Projects and Create Button */}
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Your Projects
                                </h2>
                                <Button
                                    variant="default"
                                    size="lg"
                                    className="rounded-lg"
                                    onClick={() => setShowNewProject(true)}
                                >
                                    <Plus /> Create New Project
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Projects List */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="max-w-[1200px] w-full mx-auto px-6 pb-8">
                            <div className="max-w-[800px] mx-auto">
                                <div className="space-y-3">
                                    {existingProjects.map((project) => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleSelectProject(project)}
                                            className="w-full text-left p-5 rounded-xl border-2 border-slate-200 dark:border-zinc-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-white dark:hover:bg-zinc-900 bg-white dark:bg-zinc-900/50 transition-all group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                            {project.name}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-zinc-500 mb-2">
                                                        {project.designSpecs?.length || 0} design
                                                        specification
                                                        {(project.designSpecs?.length || 0) !== 1
                                                            ? "s"
                                                            : ""}
                                                    </p>
                                                    <p className="text-xs text-slate-400 dark:text-zinc-600">
                                                        Created{" "}
                                                        {new Date(project.createdAt).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                                <ArrowRight className="w-5 h-5 text-slate-400 dark:text-zinc-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : showCreateForm ? (
                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-[1200px] w-full mx-auto px-6 pt-6 pb-2 flex-shrink-0">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                                Project Setup
                            </h1>
                            <p className="text-slate-600 dark:text-zinc-400">
                                Create a new project with design specifications
                            </p>
                        </div>
                        <div className="max-w-[700px] mx-auto">
                            {/* New Project Form */}
                            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8">
                                {/* Project Name */}
                                <div className="mb-8">
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                                        Project Name
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="e.g., Circuit Board QA - Model XR-500"
                                        className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-600 transition-colors"
                                    />
                                </div>

                                {/* Design Specifications */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-3">
                                        Design Specification(s)
                                    </label>

                                    <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-xl p-8 text-center bg-slate-50 dark:bg-zinc-950 hover:border-blue-400 dark:hover:border-blue-600 transition-colors mb-4">
                                        <input
                                            type="file"
                                            id="design-spec"
                                            onChange={handleDesignSpecUpload}
                                            accept=".pdf,.txt"
                                            multiple
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="design-spec"
                                            className="cursor-pointer block"
                                        >
                                            <FileText className="w-10 h-10 text-slate-400 dark:text-zinc-600 mx-auto mb-3" />
                                            <p className="text-slate-900 dark:text-white mb-1">
                                                Drop files here or{" "}
                                                <span className="text-blue-600 dark:text-blue-400 font-medium">
                                                    browse
                                                </span>
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-zinc-500">
                                                PDF or TXT files
                                            </p>
                                        </label>
                                    </div>

                                    {/* Uploaded Specs List */}
                                    {designSpecs.length > 0 && (
                                        <div className="space-y-4 mb-2">
                                            {designSpecs.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg p-3 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="w-9 h-9 bg-blue-50 dark:bg-blue-500/10 rounded flex items-center justify-center flex-shrink-0">
                                                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <span className="text-sm text-slate-900 dark:text-white truncate font-medium">
                                                            {file.name}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeDesignSpec(index)}
                                                        className="text-slate-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-2 p-1"
                                                        title="Remove file"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {createError && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm mb-4">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>{createError}</span>
                                    </div>
                                )}
                                {/* Create Project Button */}
                                <button
                                    onClick={handleCreateProject}
                                    disabled={
                                        !projectName.trim() ||
                                        designSpecs.length === 0 ||
                                        isCreating
                                    }
                                    className={cn(
                                        "w-full font-semibold py-4 px-6 rounded-xl transition-all disabled:cursor-not-allowed shadow-sm mt-6",
                                        projectName.trim() &&
                                        designSpecs.length > 0 &&
                                        !isCreating
                                            ? "bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 hover:dark:bg-blue-600 text-white"
                                            : "bg-slate-300 dark:bg-zinc-800 text-slate-500 dark:text-zinc-600",
                                    )}
                                >
                                    {isCreating ? "Creating..." : "Create Project"}
                                </button>

                                {/* Back to Projects List */}
                                {hasProjects && (
                                    <button
                                        onClick={() => setShowNewProject(false)}
                                        className="w-full text-sm text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white mt-4 pt-2 transition-colors"
                                    >
                                        ← Back to projects
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            ) : null}
        </div>
    );
}
