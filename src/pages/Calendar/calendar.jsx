import React, { useState, useEffect, use } from 'react';

// NAVEGAÇÃO ENTRE PÁGINAS
import { useNavigate } from 'react-router-dom';

// ESTILIZAÇÃO DA PÁGINA
import './Calendar.css';

// FUNÇÕES DE CONSULTA AO BANCO DE DADOS
import { InsertReservation, LoadReservations, GetReservation, GetItems, DeleteRe, EditReservation} from '../../db/queries';

// BIBLIOTECA RESPONSÁVEL PELOS MODAIS
import Modal from "react-modal";

// BIBLIOTECA RESPONSÁVEIS PELO CALENDÁRIO
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/pt-br';

// BIBLIOTECAS DE ICONES PARA FRONT-END
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faUser, faHourglassStart, faHourglassEnd, faTag, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";
import { faClock,faCalendar } from "@fortawesome/free-regular-svg-icons";

Modal.setAppElement('#root');

// TRADUÇÃO DE MENSAGENS DO CALENDÁRIO
moment.locale('pt-br');
const localizer = momentLocalizer(moment);
const messages = {
  allDay: 'Dia inteiro',
  previous: 'Anterior',
  next: 'Próximo',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  showMore: total => `+${total} mais`,
};


// COMPONENTE PRINCIPAL DA PÁGINA
const Main = () => {
  // VARIÁVEL PARA NAVEGAR ENTRE PÁGINAS
  const navigate = useNavigate();

  // DEFINIÇÃO DO TÍTULO DA PÁGINA
  useEffect(() => {
    document.title = "Calendário - Página Principal";
  }, []);

  // CARREGA AS RESERVAS DO BANCO DE DADOS AO INICIAR A PÁGINA E AS ADICIONA AO CALENDÁRIO
  useEffect(() => {
    // FUNÇÃO ASSÍNCRONA PARA CARREGAR AS RESERVAS E ATUALIZAR O ESTADO DO CALENDÁRIO
    const LoadReservationCalendar = async () => {
      try {
        // EXECUTA A FUNÇÃO DE CONSULTAR AS RESERVAS REGISTRADAS AO BANCO DE DADOS
        const reservations = await LoadReservations();

        // COLETANDO CADA RESERVA E TRANSFORMANDO EM EVENTO DO CALENDÁRIO
        const dbEvents = reservations.map(r => {
          console.log("Processando a Reserva:", r);

          // EXTRAINDO A DATA DA RESERVA
          const date = r.data;

          // DETERMINANDO O TIPO DE RESERVA (MANHÃ, TARDE, DIA TODO)
          const allDay = Number(r.allTime) === 1 || r.allTime === true;
          const morning = Number(r.morningTime) === 1 || r.morningTime === true;
          const afternoon = Number(r.afterTime) === 1 || r.afterTime === true;

          const parseDateTime = (d, t) => {
            if (!d) return null;
            if (!t) return moment(d, 'YYYY-MM-DD').toDate();
            return moment(`${d} ${t}`, 'YYYY-MM-DD HH:mm').toDate();
          };

          const start = date
            ? (allDay ? parseDateTime(date,'00:00') : (morning ? parseDateTime(date,'00:00') : (afternoon ? parseDateTime(date,'12:00') : parseDateTime(date, '00:00'))))
            : parseDateTime(date, '00:00');

          const end = date
            ? (allDay ? parseDateTime(date,'23:59') : (morning ? parseDateTime(date,'12:00') : (afternoon ? parseDateTime(date,'23:59') : parseDateTime(date, '00:00'))))
            : parseDateTime(date, '00:00');

          // RETORNANDO O FORMATO DA RESERVA PARA O CALENDÁRIO
          return {
            title: r.name_reservation || r.title || `Reserva ${r.userName || ''}`,
            start: start || new Date(),
            end: end || start || new Date(),
            allDay,
            morning,
            afternoon,
            id_reservation: r.idreservation,
          };
        });

        // ATRIBUINDO AS RESERVAS AO CALENDÁRIO
        setReservationsEvents(prev => {
          const key = ev => `${ev.title}_${+new Date(ev.start)}`;
          const existingKeys = new Set(prev.map(key));
          const merged = [...prev];
          dbEvents.forEach(e => {
            if (!existingKeys.has(key(e))) merged.push(e);
          });
          console.log("Eventos carregados para o calendário:", merged);
          return merged;
        });
      } catch (err) {
        console.error('Erro ao carregar reservas:', err);
      }
    };

    // EXECUTA A FUNÇÃO DE CARREGAR AS RESERVAS
    LoadReservationCalendar();
  }, []);

  // FUNÇÃO DE LOGOUT DO USUÁRIO
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  // ESTADOS DE CONTROLE DE MODAIS DA PÁGINA
  const [isModalListReservationOpen, setIsModalListReservationOpen] = useState(false);        // MODAL QUE LISTA AS RESERVAS DO DIA
  const [isModalInsertReservationOpen, setIsModalInsertReservationOpen] = useState(false);    // MODAL DE INSERÇÃO DE RESERVAS
  const [isModalInfoReservationOpen, setIsModalInfoReservationOpen] = useState(false);        // MODAL DE INFORMAÇÕES DA RESERVA
  const [isModalRemoveCondition,setIsModalRemoveCondition] = useState(false);                 // MODAL DE CONFIRMAÇÃO DE REMOÇÃO
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);                              // MODAL DE EDIÇÃO DE RESERVA
  const [editAllow, setEditAllow] = useState(false);                                        // ESTADO QUE DEFINE SE O USUÁRIO PODE EDITAR A RESERVA OU NÃO
  const [reservationsEvents, setReservationsEvents] = useState([]);                   // ESTADO QUE ARMAZENA AS RESERVAS DO CALENDÁRIO
  const [selectedDate, setSelectedDate] = useState(null);                             // ESTADO QUE ARMAZENA A DATA SELECIONADA
  const [selectedItemsReservations, setSelectedItemsReservations] = useState([]);     // ESTADO QUE ARMAZENA OS ITENS DA RESERVA SELECIONADA
  const [selectedReservation, setSelectedReservation] = useState(null);               // ESTADO QUE ARMAZENA A RESERVA SELECIONADA
  const [morningEventDate, setMornignEventDate] = useState({});                       // ESTADO QUE DEFINE QUAL RESERVA SELECIONADA É O DE AMANHÂ
  const [afternoonEventDate, setAfternoonEventDate] = useState({});                   // ESTADO QUE DEFINE QUAL RESERVA SELECIONADA É O DE TARDE
  const [allDayEventDate, setAllDayEventDate] = useState({});                         // ESTADO QUE DEFINE QUAL RESERVA SELECIONADA É O DE DIA TODO
  const [insertedItems, setInsertedItems] = useState(['']);                           // ESTADO QUE ARMAZENA OS ITENS INSERIDOS NA RESERVA

  // OPÇÕES DE ITENS PARA RESERVA
  const itemSelection =[
    'Calibrador', 'Chave de torque', 'Antena 1',
    'Tripé 1','Antena 2', 'Tripé 2', 'Cabo Roxo 1',
    'Cabo Roxo 2','Cabo Azul 1', 'Cabo Azul 2','Cabo Azul 3',
    'Cabo Azul 4','Conector emenda 1', 'Conector emenda 2',
    'Conector emenda 3', 'Conector emenda 4','Adaptador antena/cabo 1',
    'Adaptador antena/cabo 2','TurnTable Branca','TurnTabl MDF','Mesa com absorvedores'
  ];

  // ESTADO DOS ITENS SELECIONADOS
  const addItem = (arrayItem,setArrayItem) => {
    setArrayItem(prev => [...prev,arrayItem[0] || '']);
  }
  const removeItem = (setArrayItem,index) => {
    setArrayItem(prev => prev.filter((_,i) => i !== index));
  }

  const changeItem = (setArrayItem,index,value) => {
    setArrayItem(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }

  // FUNÇÃO QUE ENVIA A RESERVA PARA O BANCO DE DADOS
  const ReservationSubmit = (e) => {
    // PREVINE O RECARREGAMENTO DA PÁGINA
    e.preventDefault();

    // COLETA OS DADOS DO FORMULÁRIO
    const fd = new FormData(e.target);

    // Coletando os horários e verificando se é dia todo
    const typeRadio = fd.get('hourRadio');
    const allDayChecked = typeRadio === 'allDay';
    const morningChecked = typeRadio === 'morning';
    const afternoonChecked = typeRadio === 'afternoon';

    // Get selected items
    const items = [];
    for (const [name, value] of fd.entries()) {
      if (name.startsWith('item')) items.push(value);
    }

    // Create reservation object
    const reservation = {
      userId: localStorage.getItem('userId'),
      userName: localStorage.getItem('userName'), // Send username instead of accessing on server
      date: selectedDate ? moment(selectedDate).format('YYYY-MM-DD') : null,
      morningTime: morningChecked,
      afterTime: afternoonChecked,
      allDay: allDayChecked,
      items: items
    };
    console.log("Dados da reserva:",reservation);
    InsertReservation(reservation);
  }

  const ReservationEdit = (e) => {
    e.preventDefault();

    console.log("Executando a funcionalidade de editar uma reserva");

    const form = e.target;
    const fd = new FormData(form);

    const typeRadio = fd.get('hourRadio');
    const allDayChecked = typeRadio === 'allDay';
    const morningChecked = typeRadio === 'morning';
    const afternoonChecked = typeRadio === 'afternoon';

    // Get selected items
    const items = [];
    for (const [name, value] of fd.entries()) {
      if (name.startsWith('item')) items.push(value);
    }

    console.log("Dados dos items:",items);

    const reservation = {
      id_reservation: selectedReservation.idreservation,
      morningTime: morningChecked,
      afterTime: afternoonChecked,
      allDay: allDayChecked,
      items: items
    };

    EditReservation(reservation);
  }

  // FUNÇÃO QUE EMITE A DATA SELECIONADA E EXIBE OS HORARIOS DE CADA RESERVA
  const getDateReservations = (slotInfo) => {
    const date = slotInfo.start instanceof Date ? slotInfo.start : new Date(slotInfo.start);
    console.log("Data selecionada no calendário:",date);
    const eventsOfDay = reservationsEvents.filter(
      (ev) =>
        moment(ev.start).isSame(date, 'day') ||
        (ev.start < date && ev.end >= date)
    );
    const morningEvent = eventsOfDay.filter((ev) => ev.morning === true);
    setMornignEventDate(morningEvent[0] || {});
    const afternoonEvent = eventsOfDay.filter((ev) => ev.afternoon === true);
    setAfternoonEventDate(afternoonEvent[0] || {});
    const allDayEvent = eventsOfDay.filter((ev) => ev.allDay === true);
    setAllDayEventDate(allDayEvent[0] || {});

    console.log(morningEvent,afternoonEvent,allDayEvent);

    setSelectedDate(date);
    setIsModalListReservationOpen(true);
  };

  // FUNÇÃO QUE EXIBE DETALHES DA RESERVA AO CLICAR EM UMA DETERMINADA RESERVA
  const getReservationInfo = (slotInfo) => {
    // EXTRAINDO INFORMAÇÕES DA RESERVA
    const reservation_date = slotInfo ? moment(slotInfo.start).format('YYYY-MM-DD') : null;
    const id_reservation = slotInfo ? slotInfo.id_reservation : null;

    console.log("Informações da reserva selecionada:",reservation_date,id_reservation);

    // CONSULTANDO A RESERVA NO BANCO DE DADOS
    const fetchReservation = async () => {
      const reservations = await GetReservation({reservation_date, id_reservation});
      console.log('Reserva encontrada:', reservations);
      setSelectedReservation(reservations[0]);

      console.log(localStorage.getItem('userId'),reservations[0].fk_idUser);

      if(localStorage.getItem('userId') == reservations[0].fk_idUser){
        setEditAllow(false);
      }
      else{
        setEditAllow(true);
      }
      await fetchItems();
    };

    const fetchItems = async () => {
      const items = await GetItems(id_reservation);
      console.log('Itens encontrados',items)
      setSelectedItemsReservations(items);
      // ABRINDO O MODAL DE DETALHES DA RESERVA
      setIsModalInfoReservationOpen(true);
    }

    fetchReservation();
  };

  const DeleteReservation = (selectedReservation) => {
    const id = selectedReservation.idreservation;
    console.log("Removendo a consulta com ID: ",id);
    const fetchDelete = async()=>{
      const deleteVerfication = await DeleteRe(id);
      if(!deleteVerfication){
        console.error("Falha na deleta da reserva");
      }
      else{
        window.location.reload()
      }
    };
    fetchDelete();
  };

  return (
    <div className='Website-Main'>
      <div className='Main'>
        <div className="Calendar-Design">
          <Calendar
            localizer={localizer}
            events={reservationsEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month']}
            selectable
            onSelectSlot={getDateReservations}
            onSelectEvent={getDateReservations}
            messages={messages}
          />
        </div>

        <div className='Profile'>
          <div className='Profile-Bar'>
            <FontAwesomeIcon icon={faUser} className='Profile-Icon' />
            <h3>Bem-vindo, {localStorage.getItem('userName') || 'Usuário'}!</h3>
          </div>
          <button onClick={handleLogout} className='Btn-Logout'>Deslogar</button> {/* Add onClick handler */}
        </div>
      </div>

      <Modal isOpen={isModalListReservationOpen} onRequestClose={() => setIsModalListReservationOpen(false)} className="Modal-View-Day">
        <div className='Modal-Bar Title-View-Modal'>
          <h2 className='Hour-Style'>
            Reservas do dia: {selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : '...'}
          </h2>
          <button onClick={() => setIsModalListReservationOpen(false)} className='Modal-Btn-Close'>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className='Hour-Calendar'>
          <div className='Hours-Reservations'>
            <div className='Hour-Title' onClick={Object.keys(morningEventDate).length > 0 ? () => getReservationInfo(morningEventDate):null}>
              <h4>Reservas da manhã:</h4>
              {morningEventDate && Object.keys(morningEventDate).length > 0 ? (
                <div className='p-reservation'>
                  {morningEventDate.title}
                </div>
              ):(
                <div className='p-reservation'>
                  Nenhuma reserva.
                </div>
              )}
            </div>
            <div className='Hour-Title' onClick={Object.keys(afternoonEventDate).length > 0 ? () => getReservationInfo(afternoonEventDate):null}>
              <h4>Reservas da tarde:</h4>
              {afternoonEventDate && Object.keys(afternoonEventDate).length > 0 ? (
                <div className='p-reservation'>
                  {afternoonEventDate.title}
                </div>
              ):(
                <div className='p-reservation'>
                  Nenhuma reserva.
                </div>
              )}
            </div>
            <div className='Hour-Title' onClick={Object.keys(allDayEventDate).length > 0 ? () => getReservationInfo(allDayEventDate):null}>
              <h4>Reservas do dia todo:</h4>
              {allDayEventDate && Object.keys(allDayEventDate).length > 0 ? (
                <div className='p-reservation'>
                  {allDayEventDate.title}
                </div>
              ):(
                <div className='p-reservation'>
                  Nenhuma reserva.
                </div>
              )}
            </div>
          </div>
          <button className='Btn-Reserva' onClick={() => setIsModalInsertReservationOpen(true)}>
            Adicionar Reserva
          </button>
        </div>
      </Modal>

      {/* MODAL RESPONSÁVEL PARA INSERÇÃO DA RESERVA AO CALENDÁRIO */}
      {/* === TUDO CERTO AQUI, NÃO MEXER */}
      <Modal isOpen={isModalInsertReservationOpen} onRequestClose={() => setIsModalInsertReservationOpen(false)} className="Modal-Insert">
        <div className='Modal-Header'>
          <h2 className='Hour-Style'>
            Adicionando reserva na data {selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : '...'}
          </h2>
          <button onClick={() => setIsModalInsertReservationOpen(false)} className='Modal-Btn-Close'>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* FORMULARIO DE INSERÇÃO DA RESERVA */}
        <div className='Insert'>
          <form className='Insert-Form' onSubmit={ReservationSubmit}>
            <h3> Horário da reserva:</h3>

            <div className='radio-inputs'>
              <div className='radio-style'>
                <label className='radio-label'><FontAwesomeIcon icon={faSun} className='icon-radio'/>Manhã</label>
                <input type='radio' name='hourRadio' className='input-radio' value='morning'/>
              </div>
              <div className='radio-style'>
                <label className='radio-label'><FontAwesomeIcon icon={faMoon} className='icon-radio'/>Tarde</label>
                <input type='radio' name='hourRadio' className='input-radio' value='afternoon'/>
              </div>
              <div className='radio-style'>
                <label className='radio-label'><FontAwesomeIcon icon={faCalendar} className='icon-radio'/>Dia todo</label>
                <input type='radio' name='hourRadio' className='input-radio' value='allDay'/>
              </div>
            </div>

            {/* SELEÇÃO DE ITEMS DINAMICA */}

            <h3> Item(s) para reserva:</h3>

            <div className='items-tab'>
              {insertedItems.map((sel, idx) => (
                <div className='selection-item' key={idx}>
                  <label className='Item-Label'>Item {idx + 1}:</label>
                  <select
                    className='select-Items'
                    name={`item${idx + 1}`}
                    required
                    value={sel}
                    onChange={(e) => changeItem(setInsertedItems,idx, e.target.value)}
                  >
                    {itemSelection.map((item, index) => (
                      <option key={index} value={item}>{item}</option>
                    ))}
                  </select>
                  {idx > 0 && (
                    <button type="button" className='Btn-Remove-Item' onClick={() => removeItem(setInsertedItems,idx)}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className='Btn-Add-Item' onClick={() => addItem(itemSelection,setInsertedItems)}> Adicionar outro item </button>

            {/* BOTÃO DE CONFIRMAÇÃO DA RESERVA */}
            <button type="submit" className='Btn-Reserva'> Confirmar Reserva </button>
          </form>
        </div>
      </Modal>

      {/* MODAL RESPONSÁVEL PARA MOSTRAR OS DADOS DAQUELA RESERVA */}
      <Modal isOpen={isModalInfoReservationOpen} onRequestClose={() => setIsModalInfoReservationOpen(false)} className="Modal-Reservation">
          <div className='Modal-Header'>
            <h2 className='Hour-Style'>
              Sobre a reserva: {selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : '...'}
            </h2>                   
            <button onClick={() => setIsModalInfoReservationOpen(false)} className='Modal-Btn-Close'>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <div className='Reservation-Details'>
            {selectedReservation ? (
              <>
                <div className='Name-Padding'>
                  <div className='Name-Tab'>
                    <FontAwesomeIcon icon={faCalendar} className='Name-Reservation-Icon'/>
                    <strong>{selectedReservation.name_reservation}</strong>
                  </div>
                </div>
                <div className='Reservation-Hour'>
                  <FontAwesomeIcon icon={faClock} className='Hour-Reservation-Icon'/>
                  {selectedReservation ? (
                    selectedReservation.morningTime ? (
                      <p>Reserva da Manhã</p>
                    ) : selectedReservation.afterTime ? (
                      <p>Reserva da Tarde</p>
                    ) : selectedReservation.allTime ? (
                      <p>Reserva do Dia todo</p>
                    ) : null
                  ) : null}
                </div>
              </>
            ) : (
              <p>Nenhum detalhe disponível.</p>
            )}

            <hr className='hr-modal'/>

            <div className='Items-Padding'>
              <div className='items-tab-view'>
                <p className='Itens-Title'> Itens reservados: </p>
                <div className='listing-items'>
                  {selectedItemsReservations.map(item => (
                    <li key={item.id_item} className='Item-Topic'>
                      <FontAwesomeIcon icon={faTag} className='Item-Tag'/>
                      {item.name}
                    </li>
                  ))}
                </div>
              </div>
            </div>
            <div className='Btn-Bar'>
                  <button className='Btn-Modal-Reservation' disabled={editAllow} onClick={() => setIsModalEditOpen(true)}>Editar reserva</button>
                  <button className='Btn-Modal-Reservation' disabled={editAllow} onClick={() => setIsModalRemoveCondition(true)}>Remover reserva</button>
            </div>
          </div>
      </Modal>

      <Modal isOpen={isModalRemoveCondition} onRequestClose={() => setIsModalRemoveCondition(false)} className='Remove-Condition'>
        <p className='p-remove'>Certeza que deseja remover a reserva?</p>
        <div>
          <button className='Btn-cancel-remove' onClick={() => setIsModalRemoveCondition(false)}> Cancelar</button>
          <button className='Btn-confirm-remove' onClick={() => DeleteReservation(selectedReservation)}>Remover a reserva</button>
        </div>
      </Modal>

      <Modal isOpen={isModalEditOpen} onRequestClose={() => setIsModalEditOpen(false)} className="Modal-Insert">
        <div className='Modal-Header'>
          <h2 className='Hour-Style'>
            Editando reserva na data {selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : '...'}
          </h2>
          <button onClick={() => setIsModalEditOpen(false)} className='Modal-Btn-Close'>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* FORMULARIO DE INSERÇÃO DA RESERVA */}
        <div className='Insert'>
          <form className='Insert-Form' onSubmit={ReservationEdit}>
            <div className='radio-inputs'>
              <div className='radio-style'>
                <label className='radio-label'><FontAwesomeIcon icon={faSun} className='icon-radio'/>Manhã</label>
                <input type='radio' name='hourRadio' className='input-radio' value='morning'/>
              </div>
              <div className='radio-style'>
                <label className='radio-label'><FontAwesomeIcon icon={faMoon} className='icon-radio'/>Tarde</label>
                <input type='radio' name='hourRadio' className='input-radio' value='afternoon'/>
              </div>
              <div className='radio-style'>
                <label className='radio-label'><FontAwesomeIcon icon={faCalendar} className='icon-radio'/>Dia todo</label>
                <input type='radio' name='hourRadio' className='input-radio' value='allDay'/>
              </div>
            </div>

            {/* SELEÇÃO DE ITEMS DINAMICA */}

            <h3> Item(s) para reserva:</h3>

            <div className='items-tab'>
              {selectedItemsReservations.map((sel, idx) => (
                <div className='selection-item' key={idx}>
                  <label className='Item-Label'>Item {idx + 1}:</label>
                  <select
                    className='select-Items'
                    name={`item${idx + 1}`}
                    required
                    value={sel.name}
                    onChange={(e) => changeItem(setSelectedItemsReservations,idx, e.target.value)}
                  >
                    {itemSelection.map((item, index) => (
                      <option key={index} value={item}>{item}</option>
                    ))}
                  </select>
                  {idx > 0 && (
                    <button type="button" className='Btn-Remove-Item' onClick={() => removeItem(setSelectedItemsReservations,idx)}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className='Btn-Add-Item' onClick={() => addItem(selectedItemsReservations,setSelectedItemsReservations)}> Adicionar outro item </button>

            {/* BOTÃO DE CONFIRMAÇÃO DA RESERVA */}
            <button type="submit" className='Btn-Reserva'> Editar Reserva </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Main;
