import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './App.css';
import Results from './pages/results'
import Home from './pages/home';

const App = () => {
  return (
    <Router>
    <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/results' element={<Results/>} />
    </Routes>
    </Router>
  );
}

export default App
