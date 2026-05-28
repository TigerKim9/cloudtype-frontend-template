import './App.css';
import {BrowserRouter as Router, Route, Routes} from 'react-router-dom'
import ListGuests from "./components/ListGuests";
import Header from "./components/Header";
import AddGuest from "./components/AddGuest";
import CopyrightChecker from "./components/CopyrightChecker";
import HistoryPage from "./components/HistoryPage";

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
        <Router>
            <Header />
                <Routes>
                    <Route path = "/" element={<CopyrightChecker />}></Route>
                    <Route path = "/copyright" element={<CopyrightChecker />}></Route>
                    <Route path = "/history" element={<HistoryPage />}></Route>
                    <Route path = "/waitlist" element={<ListGuests />}></Route>
                    <Route path = "/add-guest" element={<AddGuest />}></Route>
                    <Route path = "/edit-guest/:id" element={<AddGuest />}></Route>
                </Routes>
        </Router>
    </div>
  );
}

export default App;
