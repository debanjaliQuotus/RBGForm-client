import { BrowserRouter, Route, Routes } from "react-router-dom";
import UserForm from "./component/Form";
import SubAdminPage from "./component/SubAdminPage";
import AdminPage from "./component/AdminPage";
import Register from "./component/Register";
import Login from "./component/Login";

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path='/user' element={<UserForm/>}/>
      <Route path='/sub-admin' element={<SubAdminPage/>}/>
      <Route path='/admin' element={<AdminPage/>}/>
      <Route path='/register' element={<Register />} />
      <Route path='/' element={<Login />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;
