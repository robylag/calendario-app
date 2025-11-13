import { useNavigate } from 'react-router-dom';  
// ESTE ARQUIVO TEM COMO FUNCIONALIDADE CENTRALIZAR AS CONSULTAS E INSERÇÕES AO BANCO DE DADOS SQL

// FUNÇÃO QUE INSERE UMA NOVA RESERVA NO BANCO DE DADOS
export const InsertReservation = async (reservation) => {
    // REQUIÇÃO PARA O BACKEND
    fetch('http://localhost:5000/reservations', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(reservation)
        })
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.text();
            console.error('Server response:', errorData);
            throw new Error(`Erro no servidor (${res.status})`);
          }
          return res.json();
        })
        .then(data => {
            console.log('Reserva criada com sucesso:', data);
            window.location.reload()
        })
        .catch(error => {
            console.error('Error:', error);
    });
};

// FUNÇÃO QUE REALIZA UMA PESQUISA AO BANCO DE DADOS AO LOGAR UM USUÁRIO
export const LoginUser = async (email, password,navigate) => {
    // REQUIÇÃO PARA O BACKEND

    fetch('http://localhost:5000/loginverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email , password })
    })
    .then(res => res.json())
    .then(data => {
      // SE O LOGIN FOR BEM-SUCEDIDO, ARMAZENA INFORMAÇÕES NO LOCALSTORAGE E REDIRECIONA PARA A PÁGINA PRINCIPAL
      if(data.success) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userEmail', email);
        // armazena nome do usuário se fornecido pelo backend
        const name = data.username || (data.user && data.user.username) || '';
        const userId = data.user.id_user || (data.user && data.user.id_user) || '';
        if(name) localStorage.setItem('userName', name);
        localStorage.setItem('userId', data.user.id_user);
        navigate("/calendar");
      }
      // CASO CONTRÁRIO, EXIBE UMA MENSAGEM DE ERRO
      else alert("Email ou senha incorretos!");
    })
    .catch(err => console.error("Erro na requisição:", err));
};

// FUNÇÃO QUE CARREGA TODAS AS RESERVAS E AS INSERE AO CALENDARIO
export const LoadReservations = async () => {
  try {
    const response = await fetch('http://localhost:5000/calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!Array.isArray(data)) {
      console.warn('Response is not an array:', data);
      return [];
    }

    return data;
  } catch (error) {
    console.error('Error loading reservations:', error);
    return [];
  }
};

export const GetReservation = async(info_reservation) => {
  const { inicial_hour, final_hour, date_reservation } = info_reservation;
  try {
    const response = await fetch('http://localhost:5000/getreservation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(info_reservation)
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting reservation:', error);
    return null;
  }
};

export const GetItems = async(id_reservation) => {
  try{
    const response = await fetch('http://localhost:5000/getitem',{
      method: 'POST',
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({id:id_reservation})
    });
    if (!response.ok){
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error){
    console.error('Error getting reservation:', error);
    return null;
  }
};

export const DeleteRe = async(id) =>{
  try{
    const response = await fetch('http://localhost:5000/deleteReservation',{
      method: 'POST',
      headers:{
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({id:id})
    });
    if (!response.ok){
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if(data != null){
      return true;
    }
    else return false;
  }catch(error){
    console.error('Error de deleta:',error);
    return false;
  }
};

export const EditReservation = async(reservation) =>{
  try{
    const response = await fetch('http://localhost:5000/editReservation',{
      method:'POST',
      headers:{
        'Content-Type':'application/json'
      },
      body: JSON.stringify(reservation)
    });
    if(!response.ok){
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if(data){
      window.location.reload()
    }
  }catch(error){
    console.error('Falha na edição da reserva',error);
    return;
  }
};