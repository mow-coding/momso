import { AnnotationEditor } from '../features/threads/AnnotationEditor'
import { useTimelineFrameSync } from '../features/timeline/useTimelineFrameSync'
import { ThreadSidebar } from '../features/threads/ThreadSidebar'
import { ViewerPane } from '../features/viewer/ViewerPane'
import { useWorkspaceStore } from '../stores/useWorkspaceStore'

function App() {
  useTimelineFrameSync()

  const sidebarCollapsed = useWorkspaceStore((state) => state.sidebarCollapsed)

  return (
    <main className="min-h-screen bg-body-bg p-3 sm:p-4">
      <div
        className={[
          'mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1800px] grid-cols-1 gap-3 lg:gap-4',
          sidebarCollapsed
            ? 'lg:grid-cols-[5.5rem_minmax(0,1.35fr)_minmax(0,0.95fr)]'
            : 'lg:grid-cols-[17.5rem_minmax(0,1.35fr)_minmax(0,0.95fr)]',
        ].join(' ')}
      >
        <ThreadSidebar />
        <ViewerPane />
        <AnnotationEditor />
      </div>
    </main>
  )
}

export default App
