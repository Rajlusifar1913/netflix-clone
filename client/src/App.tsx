import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppProvider } from "@/components/AppProvider";
import HomePage    from "@/pages/Home";
import LoginPage   from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import ProfilesPage from "@/pages/Profiles";
import BrowsePage  from "@/pages/Browse";
import TVShowsPage from "@/pages/TVShows";
import MoviesPage  from "@/pages/Movies";
import NewPopularPage from "@/pages/NewPopular";
import MyListPage  from "@/pages/MyList";
import WatchPage   from "@/pages/Watch";
import AccountPage from "@/pages/Account";
import SearchPage  from "@/pages/Search";
import HelpPage    from "@/pages/Help";

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/"         element={<HomePage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/browse"   element={<BrowsePage />} />
          <Route path="/tv-shows" element={<TVShowsPage />} />
          <Route path="/movies"   element={<MoviesPage />} />
          <Route path="/latest"   element={<NewPopularPage />} />
          <Route path="/my-list"  element={<MyListPage />} />
          <Route path="/watch"    element={<WatchPage />} />
          <Route path="/account"  element={<AccountPage />} />
          <Route path="/search"   element={<SearchPage />} />
          <Route path="/help"     element={<HelpPage />} />
          {/* Catch-all → redirect to home */}
          <Route path="*"         element={<HomePage />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
