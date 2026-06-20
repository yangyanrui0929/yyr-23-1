import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom"
import SandboxPage from "@/pages/SandboxPage"
import LineagePage from "@/pages/LineagePage"
import ChroniclePage from "@/pages/ChroniclePage"
import { ScrollText, GitBranch } from "lucide-react"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SandboxPage />} />
        <Route path="/lineage" element={<LineagePage />} />
        <Route path="/chronicle" element={<ChroniclePage />} />
      </Routes>
      <nav className="fixed top-4 left-4 z-50 flex gap-2">
        <Link
          to="/lineage"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#1a1a2e]/90 border border-[#3d3228] text-[#d4a574] hover:border-[#C4703F] hover:text-[#C4703F] transition-colors"
        >
          <GitBranch size={14} />
          谱系
        </Link>
        <Link
          to="/chronicle"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#1a1a2e]/90 border border-[#3d3228] text-[#d4a574] hover:border-[#C4703F] hover:text-[#C4703F] transition-colors"
        >
          <ScrollText size={14} />
          纪年
        </Link>
      </nav>
    </Router>
  )
}
