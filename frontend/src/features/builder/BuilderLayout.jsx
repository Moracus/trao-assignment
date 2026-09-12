import BuilderHeader from "./BuilderHeader";
import BuilderSidebar from "./BuilderSidebar";

export default function BuilderLayout({
  kit,
  children,
  dirty,
  regenerating,
  onRegenerate,
  onFullKitRegenerate,
  activeSection,
  onSectionChange,
}) {
  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden">
      <BuilderHeader
        kit={kit}
        dirty={dirty}
        regenerating={regenerating}
        onRegenerate={onRegenerate}
        onFullKitRegenerate={onFullKitRegenerate}
      />

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <BuilderSidebar
          active={activeSection}
          onChange={onSectionChange}
        />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children(activeSection)}
        </main>
      </div>
    </div>
  );
}