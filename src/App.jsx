import { BrowserRouter, Route, Routes } from "react-router-dom";
import UserForm from "./component/Form";
import SubAdminPage from "./component/SubAdminPage";
import AdminPage from "./component/AdminPage";


function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route path='/user' element={<UserForm/>}/>
      <Route path='/subadmin' element={<SubAdminPage/>}/>
      <Route path='/admin' element={<AdminPage/>}/>
    </Routes>
    </BrowserRouter>
  );
}

export default App;
