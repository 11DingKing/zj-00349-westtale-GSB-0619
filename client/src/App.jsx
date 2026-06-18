import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import VisitorLayout from "./components/VisitorLayout.jsx";
import AdminLayout from "./components/AdminLayout.jsx";

import Home from "./pages/visitor/Home.jsx";
import StorylineDetail from "./pages/visitor/StorylineDetail.jsx";
import ChapterDetail from "./pages/visitor/ChapterDetail.jsx";
import Artifacts from "./pages/visitor/Artifacts.jsx";
import ArtifactDetail from "./pages/visitor/ArtifactDetail.jsx";
import Figures from "./pages/visitor/Figures.jsx";
import FigureDetail from "./pages/visitor/FigureDetail.jsx";
import FigureStoryline from "./pages/visitor/FigureStoryline.jsx";

import Dashboard from "./pages/admin/Dashboard.jsx";
import StorylineManage from "./pages/admin/StorylineManage.jsx";
import ChapterManage from "./pages/admin/ChapterManage.jsx";
import ArtifactManage from "./pages/admin/ArtifactManage.jsx";
import FigureManage from "./pages/admin/FigureManage.jsx";
import CommentManage from "./pages/admin/CommentManage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<VisitorLayout />}>
        <Route index element={<Home />} />
        <Route path="storyline/:id" element={<StorylineDetail />} />
        <Route path="chapter/:id" element={<ChapterDetail />} />
        <Route path="artifacts" element={<Artifacts />} />
        <Route path="artifact/:id" element={<ArtifactDetail />} />
        <Route path="figures" element={<Figures />} />
        <Route path="figure/:id" element={<FigureDetail />} />
        <Route path="figure/:id/storyline" element={<FigureStoryline />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="storylines" element={<StorylineManage />} />
        <Route path="chapters" element={<ChapterManage />} />
        <Route path="artifacts" element={<ArtifactManage />} />
        <Route path="figures" element={<FigureManage />} />
        <Route path="comments" element={<CommentManage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
