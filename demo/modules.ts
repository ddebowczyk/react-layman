export interface ModuleDescriptor {
    moduleId: string;
    kind: "dashboard" | "editor" | "profile" | "settings";
}
