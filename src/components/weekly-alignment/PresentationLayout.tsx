import React from 'react';

export const PresentationLayout: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  header: React.ReactNode;
  navigation: React.ReactNode;
  children: React.ReactNode;
  overlays?: React.ReactNode;
}> = ({ containerRef, header, navigation, children, overlays }) => {
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 flex h-screen w-screen flex-col overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1117] text-slate-900 dark:text-slate-100"
    >
      {header}

      <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="mx-auto max-w-[1600px] h-full min-w-0">{children}</div>
      </main>

      {navigation}

      {/* Drawers e modais internos ao root ref para permanecerem visíveis em Fullscreen */}
      {overlays}
    </div>
  );
};
