// PÁGINA DE LOGIN

// BIBLIOTECAS
import {useState, useEffect} from 'react';                                                             // React
import './Login.css';                                                                         // Estilização CSS
import { useNavigate } from 'react-router-dom';                                             // Redirecionamento de páginas
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";                           // FontAwesome
import { faCalendarDays, faEnvelope, faKey } from "@fortawesome/free-solid-svg-icons";      // Ícones do FontAwesome
import { LoginUser } from '../../db/queries';                                                      // Função de login

// FUNÇÃO PRINCIPAL DO LOGIN

function Login() {
  // Variável navigate para redirecionamento de páginas
  const navigate = useNavigate();

  // VARIÁVEIS DE EMAIL E SENHA PARA ENVIAR PARA A VERIFICAÇÃO DO BANCO
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // FUNÇÃO DE SUBMIT DO LOGIN
  const handleSubmit = (e) => {
    // PREVENÇÃO DO RELOAD DO FORM
    e.preventDefault();
    LoginUser(email, password, navigate);
  }

  useEffect(() => {
      document.title = "Página de Login";
    }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="Login-Tab">
          <div className="Login-Logo">
            <FontAwesomeIcon icon={faCalendarDays} className="Calendar-Icon" />
          </div>
          <h1 className="Login-Title">Entre com sua conta</h1>

          <form className="Login-Form" onSubmit={handleSubmit}>
            <div className="Input-Container">
              <FontAwesomeIcon icon={faEnvelope} className="Input-Icon" />
              <input className="Input-Login" type="email" placeholder="Email" value={email} required onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="Input-Container">
              <FontAwesomeIcon icon={faKey} className="Input-Icon" />
              <input className="Input-Login" type="password" placeholder="Senha de usuário" value={password} required onChange={(e) => setPassword(e.target.value)}/>
            </div>
            <input className="Submit-Login" type="submit" value="Conectar-se" />
          </form>
        </div>
      </header>
    </div>
  );
}

export default Login;
