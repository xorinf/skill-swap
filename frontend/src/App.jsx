import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Shell from './components/Shell.jsx';
import PageErrorBoundary from './components/PageErrorBoundary.jsx';
import { useAuth } from './state/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import EditProfile from './pages/EditProfile.jsx';
import Matches from './pages/Matches.jsx';
import MatchDetail from './pages/MatchDetail.jsx';
import Feed from './pages/Feed.jsx';
import PostDetail from './pages/PostDetail.jsx';
import CreatePost from './pages/CreatePost.jsx';
import Messages from './pages/Messages.jsx';
import Conversation from './pages/Conversation.jsx';
import MyMatches from './pages/MyMatches.jsx';
import SessionDetail from './pages/SessionDetail.jsx';
import Wishlist from './pages/Wishlist.jsx';
import NewWishlist from './pages/NewWishlist.jsx';
import WishlistDetail from './pages/WishlistDetail.jsx';
import Credits from './pages/Credits.jsx';
import Impact from './pages/Impact.jsx';
import Notifications from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';
import AIDiscover from './pages/AIDiscover.jsx';
import Onboarding from './pages/Onboarding.jsx';

function Protected({ children }) {
  const { user, bootstrapped } = useAuth();
  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="card flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-200 border-t-ink-800" />
          <span className="text-ink-700">Loading Skill Swap…</span>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  // ponytail: skip if user has at least one skill. We don't block forever — just nudge on first visit.
  const hasSkills = (user.skillsCanTeach?.length || 0) + (user.skillsToLearn?.length || 0) > 0;
  if (!hasSkills) return <Navigate to="/onboarding" replace />;
  return children;
}

function RoutedShell() {
  return (
    <Shell>
      <PageErrorBoundary>
        <Outlet />
      </PageErrorBoundary>
    </Shell>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<Protected><RoutedShell /></Protected>}>
        <Route path="/" element={<Home />} />
        <Route path="/discover/ai" element={<AIDiscover />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:userId" element={<MatchDetail />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/feed/new" element={<CreatePost />} />
        <Route path="/feed/:id" element={<PostDetail />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/with/:userId" element={<Conversation />} />
        <Route path="/messages/:id" element={<Conversation />} />
        <Route path="/my-matches" element={<MyMatches />} />
        <Route path="/sessions/:id" element={<SessionDetail />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/wishlist/new" element={<NewWishlist />} />
        <Route path="/wishlist/:id" element={<WishlistDetail />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
