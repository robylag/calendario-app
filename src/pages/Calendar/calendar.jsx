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


// COMONENTE PRINCIPAL DA PÁGINA
const Main = () => {
  // DEFINIÇÃO DO TÍTULO DA PÁGINA
  useEffect(() => {
    document.title = "Calendário - Página Principal";
  }, []);

  // VARIÁVEL PARA NAVEGAR ENTRE PÁGINAS
  const navigate = useNavigate();

  // CONTROLE DE MODAIS
  const [ModalDateIsOpen, setModalDateIsOpen] = useState(false);
  const [isInsertModalOpen, setIsInsertModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isRemoveCondition,setIsRemoveCondition] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editAllow, setEditAllow] = useState(false);

  const [editData, setEditData] = useState({
    startTime: "",
    endTime: "",
    allDay: false
  });

  const [rows, setRows] = useState([]);

  // ESTADOS DO CALENDÁRIO
  const [events, setEvents] = useState([]);

  // DATA SELECIONADA E EVENTOS DO DIA
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);
  let [HourItem, setHourItem] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [morningEvents, setMorningEvents] = useState({});
  const [afternoonEvents, setAfternoonEvents] = useState({});
  const [allDayEvents, setAllDayEvents] = useState({});

  // OPÇÕES DE ITENS PARA RESERVA
  const [itemSelection, setItemSelection] = useState([
    'Calibrador', 'Chave de torque', 'Antena 1', 'Tripé 1','Antena 2', 'Tripé 2', 'Cabo Roxo 1', 'Cabo Roxo 2','Cabo Azul 1', 'Cabo Azul 2','Cabo Azul 3', 'Cabo Azul 4','Conector emenda 1', 'Conector emenda 2','Conector emenda 3', 'Conector emenda 4','Adaptador antena/cabo 1', 'Adaptador antena/cabo 2','TurnTable Branca','TurnTabl MDF','Mesa com absorvedores'
  ]);

  // ESTADO DOS ITENS SELECIONADOS
  const [selectedItems, setSelectedItems] = useState([itemSelection[0] || '']);

  // CONTROLA SE A RESERVA É O DIA TODO
  const [isAllDay, setIsAllDay] = useState(false);


  const handleAddItem = () => {
    setSelectedItems(prev => [...prev, itemSelection[0] || '']);
  }

  const handleChangeItem = (index, value) => {
    setSelectedItems(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  }

  const editChangeItem = (index,value) => {
    setHourItem(prev => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    })
  }

  const editAddItem = () =>{
    setHourItem(prev => [...prev,HourItem[0] || '']);
  }

  const editRemoveItem = (index) => {
    setHourItem(prev => prev.filter((_,i) => i !== index));
  }

  const handleRemoveItem = (index) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  }

  // FUNÇÃO QUE ENVIA A RESERVA PARA O BANCO DE DADOS
  const ReservationSubmit = (e) => {
    // PREVINE O RECARREGAMENTO DA PÁGINA
    e.preventDefault();

    // COLETA OS DADOS DO FORMULÁRIO
    const form = e.target;
    const fd = new FormData(form);

    // Coletando os horários e verificando se é dia todo
    const allDayChecked = fd.get('allDay') !== null;
    const startTime = allDayChecked ? '00:00' : fd.get('startTime');
    const endTime = allDayChecked ? '23:59' : fd.get('endTime');

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
      startTime: startTime,
      endTime: endTime,
      allDay: allDayChecked,
      items: items
    };

    InsertReservation(reservation);
  }

  const ReservationEdit = (e) => {
    e.preventDefault();

    console.log("Executando a funcionalidade de editar uma reserva");

    const form = e.target;
    const fd = new FormData(form);

    const allDayChecked = fd.get('allDay') !== null;
    const startTime = allDayChecked ? '00:00' : fd.get('startTime');
    const endTime = allDayChecked ? '23:59' : fd.get('endTime');

    console.log("Dados da reserva:",startTime,endTime,allDayChecked);

    // Get selected items
    const items = [];
    for (const [name, value] of fd.entries()) {
      if (name.startsWith('item')) items.push(value);
    }

    console.log("Dados dos items:",items);

    const reservation = {
      id_reservation: selectedReservation.id_reservation,
      startTime: startTime,
      endTime: endTime,
      allDay: allDayChecked,
      items: items
    };
    
    EditReservation(reservation);
  }

  const editChangeHour = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  // FUNÇÃO QUE EMITE A DATA SELECIONADA E EXIBE OS HORARIOS DE CADA RESERVA
  const DateSelect = (slotInfo) => {
    const date = slotInfo.start instanceof Date ? slotInfo.start : new Date(slotInfo.start);
    const eventsOfDay = events.filter(
      (ev) =>
        moment(ev.start).isSame(date, 'day') ||
        (ev.start < date && ev.end >= date)
    );
    const morningEvent = eventsOfDay.filter((ev) => ev.morning === true);
    setMorningEvents(morningEvent[0] || {});
    const afternoonEvent = eventsOfDay.filter((ev) => ev.afternoon === true);
    setAfternoonEvents(afternoonEvent[0] || {});
    const allDayEvent = eventsOfDay.filter((ev) => ev.allDay === true);
    setAllDayEvents(allDayEvent[0] || {});

    console.log(morningEvents,afternoonEvents,allDayEvents);

    setSelectedDate(date);
    setDayEvents(eventsOfDay);
    setModalDateIsOpen(true);
  };

  // FUNÇÃO QUE EXIBE DETALHES DA RESERVA AO CLICAR EM UMA DETERMINADA RESERVA
  const HourSelect = (slotInfo) => {
    // EXTRAINDO INFORMAÇÕES DA RESERVA
    const inicial_hour = moment(slotInfo.start).format('HH:mm:ss');
    const final_hour = moment(slotInfo.end).format('HH:mm:ss');
    const date_reservation = moment(slotInfo.start).format('YYYY-MM-DD');
    let id_re;

    // CONSULTANDO A RESERVA NO BANCO DE DADOS
    const fetchReservation = async () => {
      const reservations = await GetReservation({inicial_hour,final_hour,date_reservation});
      console.log('Reserva encontrada:', reservations);
      setSelectedReservation(reservations[0]);

      console.log(localStorage.getItem('userId'),reservations[0].usuario_id);

      if(localStorage.getItem('userId') == reservations[0].usuario_id){
        setEditAllow(false);
      }
      else{
        setEditAllow(true);
      }

      id_re = reservations[0].id_reservation;
      await fetchItems();
    };

    const fetchItems = async () => {
      const items = await GetItems(id_re);
      console.log('Itens encontrados',items)
      setHourItem(items);
      // ABRINDO O MODAL DE DETALHES DA RESERVA
      setIsReservationModalOpen(true);
    }

    fetchReservation();
  };

  const DeleteReservation = (selectedReservation) => {
    const id = selectedReservation.id_reservation;
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

  // FUNÇÃO DE LOGOUT DO USUÁRIO
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const openEditModal = () => {
    setEditData({
        startTime: moment(selectedReservation.inicial_hour, "HH:mm:ss").format("HH:mm"),
        endTime: moment(selectedReservation.final_hour, "HH:mm:ss").format("HH:mm"),
        allDay: !!selectedReservation.all_day,
    });
    setIsEditModalOpen(true);
  };

  // CARREGA AS RESERVAS DO BANCO DE DADOS AO INICIAR A PÁGINA E AS ADICIONA AO CALENDÁRIO
  useEffect(() => {
    const loadReservations = async () => {
      try {
        // Aguarda o resultado da função LoadReservations
        const reservations = await LoadReservations();
        setRows(reservations); // Atualiza o estado com as reservas carregadas

        const dbEvents = reservations.map(r => {
          console.log("Processando reserva do banco:", r);
          const date = r.date;
          const allDay = Number(r.all_time) === 1 || r.all_time === true;
          const morning = Number(r.morning_time) === 1 || r.morningTime === true;
          const afternoon = Number(r.after_time) === 1 || r.after_time === true;

          const parseDateTime = (d, t) => {
            if (!d) return null;
            if (!t) return moment(d, 'YYYY-MM-DD').toDate();
            return moment(`${d} ${t}`, 'YYYY-MM-DD HH:mm').toDate();
          };

          const start = date
            ? (allDay ? parseDateTime(date,'00:00') : (morning ? parseDateTime(date,'00:00') : (afternoon ? parseDateTime(date,'12:00') : parseDateTime(date, '00:00'))))
            : parseDateTime(date, '00:00');

          const end = date
            ? (allDay ? parseDateTime(date,'24:00') : (morning ? parseDateTime(date,'12:00') : (afternoon ? parseDateTime(date,'24:00') : parseDateTime(date, '00:00'))))
            : parseDateTime(date, '00:00');

          return {
            title: r.name_reservation || r.title || `Reserva ${r.userName || ''}`,
            start: start || new Date(),
            end: end || start || new Date(),
            allDay,
            morning,
            afternoon,
          };
        });

        setEvents(prev => {
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

    loadReservations();
  }, []);

  return (
    <div className='Website-Main'>
      <div className='Main'>
        <div className="Calendar-Design">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month']}
            selectable
            onSelectSlot={DateSelect}
            onSelectEvent={DateSelect}
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

      <Modal isOpen={ModalDateIsOpen} onRequestClose={() => setModalDateIsOpen(false)} className="Modal-View-Day">
        <div className='Modal-Bar Title-View-Modal'>
          <h2 className='Hour-Style'>
            Reservas do dia: {selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : '...'}
          </h2>
          <button onClick={() => setModalDateIsOpen(false)} className='Modal-Btn-Close'>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className='Hour-Calendar'>
          <div className='Hours-Reservations'>
            <div className='Hour-Title'>
              <h4>Reservas da manhã:</h4>
              {morningEvents && Object.keys(morningEvents).length > 0 ? (
                <div className='p-reservation'>
                  {morningEvents.title}
                </div>
              ):(
                <p>Nenhuma reserva.</p>
              )}
            </div>
            <div className='Hour-Title'>
              <h4>Reservas da tarde:</h4>
              {afternoonEvents && Object.keys(afternoonEvents).length > 0 ? (
                <div className='p-reservation'>
                  {afternoonEvents.title}
                </div>
              ):(
                <p>Nenhuma reserva.</p>
              )}
            </div>
            <div className='Hour-Title'>
              <h4>Reservas do dia todo:</h4>
              {allDayEvents && Object.keys(allDayEvents).length > 0 ? (
                <div className='p-reservation'>
                  {allDayEvents.title}
                </div>
              ):(
                <p>Nenhuma reserva.</p>
              )}
            </div>
          </div>
          <button className='Btn-Reserva' onClick={() => setIsInsertModalOpen(true)}>
            Adicionar Reserva
          </button>
        </div>
      </Modal>

      {/* MODAL RESPONSÁVEL PARA INSERÇÃO DA RESERVA AO CALENDÁRIO */}
      <Modal isOpen={isInsertModalOpen} onRequestClose={() => setIsInsertModalOpen(false)} className="Modal-Insert">
        <div className='Modal-Header'>
          <h2 className='Hour-Style'>
            Adicionando reserva na data {selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : '...'}
          </h2>
          <button onClick={() => setIsInsertModalOpen(false)} className='Modal-Btn-Close'>
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
                <input type='radio' name='hourRadio' className='input-radio'/>
              </div>
              <div className='radio-style'>
                <label className='radio-label'><FontAwesomeIcon icon={faMoon} className='icon-radio'/>Tarde</label>
                <input type='radio' name='hourRadio' className='input-radio'/>
              </div>
              <div className='radio-style'>
                <label className='radio-label'><FontAwesomeIcon icon={faCalendar} className='icon-radio'/>Dia todo</label>
                <input type='radio' name='hourRadio' className='input-radio'/>
              </div>
            </div>

            {/* SELEÇÃO DE ITEMS DINAMICA */}

            <h3> Item(s) para reserva:</h3>

            <div className='items-tab'>
              {selectedItems.map((sel, idx) => (
                <div className='selection-item' key={idx}>
                  <label className='Item-Label'>Item {idx + 1}:</label>
                  <select
                    className='select-Items'
                    name={`item${idx + 1}`}
                    required
                    value={sel}
                    onChange={(e) => handleChangeItem(idx, e.target.value)}
                  >
                    {itemSelection.map((item, index) => (
                      <option key={index} value={item}>{item}</option>
                    ))}
                  </select>
                  {idx > 0 && (
                    <button type="button" className='Btn-Remove-Item' onClick={() => handleRemoveItem(idx)}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className='Btn-Add-Item' onClick={handleAddItem}> Adicionar outro item </button>

            {/* BOTÃO DE CONFIRMAÇÃO DA RESERVA */}
            <button type="submit" className='Btn-Reserva' onClick={() => setIsEditModalOpen(true)}> Confirmar Reserva </button>
          </form>
        </div>
      </Modal>

      {/* MODAL RESPONSÁVEL PARA MOSTRAR OS DADOS DAQUELA RESERVA */}
      <Modal isOpen={isReservationModalOpen} onRequestClose={() => setIsReservationModalOpen(false)} className="Modal-Reservation">
          <div className='Modal-Header'>
            <h2 className='Hour-Style'>
              Sobre a reserva: {selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : '...'}
            </h2>                   
            <button onClick={() => setIsReservationModalOpen(false)} className='Modal-Btn-Close'>
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
                  <div className='Hour-Padding'>
                    <div className='Hour-Tab'>
                      Início:
                      <strong className='Hour-Information'>
                        <FontAwesomeIcon icon={faClock} />
                        {moment(selectedReservation.inicial_hour,'HH:mm:ss').format("HH:mm")}
                      </strong>
                    </div>
                  </div>

                  <div className='Hour-Padding'>
                    <div className='Hour-Tab'>
                      Fim:
                      <strong className='Hour-Information'>
                        <FontAwesomeIcon icon={faClock} />
                        {moment(selectedReservation.final_hour,'HH:mm:ss').format("HH:mm")}
                      </strong>
                    </div>
                  </div>
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
                  {HourItem.map(item => (
                    <li key={item.id_item} className='Item-Topic'>
                      <FontAwesomeIcon icon={faTag} className='Item-Tag'/>
                      {item.name_item}
                    </li>
                  ))}
                </div>
              </div>
            </div>
            <div className='Btn-Bar'>
                  <button className='Btn-Modal-Reservation' disabled={editAllow} onClick={openEditModal}>Editar reserva</button>
                  <button className='Btn-Modal-Reservation' disabled={editAllow} onClick={() => setIsRemoveCondition(true)}>Remover reserva</button>
            </div>
          </div>
      </Modal>

      <Modal isOpen={isRemoveCondition} onRequestClose={() => setIsRemoveCondition(false)} className='Remove-Condition'>
        <p className='p-remove'>Certeza que deseja remover a reserva?</p>
        <div>
          <button className='Btn-cancel-remove' onClick={() => setIsRemoveCondition(false)}> Cancelar</button>
          <button className='Btn-confirm-remove' onClick={() => DeleteReservation(selectedReservation)}>Remover a reserva</button>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)} className="Modal-Insert">
        <div className='Modal-Header'>
          <h2 className='Hour-Style'>
            Editando reserva na data {selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : '...'}
          </h2>
          <button onClick={() => setIsEditModalOpen(false)} className='Modal-Btn-Close'>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* FORMULARIO DE INSERÇÃO DA RESERVA */}
        <div className='Insert'>
          <form className='Insert-Form' onSubmit={ReservationEdit}>
            {editData ? (
              <>
                <label> Horário Inicial: </label>
                <input
                  type="time"
                  name="startTime"
                  required
                  className='insert-input'
                  disabled={isAllDay}
                  value={moment(editData.startTime,'HH:mm:ss').format('HH:mm')}
                  onChange={editChangeHour}
                />

                <label> Horário Final: </label>
                <input
                  type="time"
                  name="endTime"
                  required
                  className='insert-input'
                  disabled={isAllDay}
                  value={moment(editData.endTime,'HH:mm:ss').format('HH:mm')}
                  onChange={editChangeHour}
                />

                <div className='allDay-Format'>
                  <label> Dia todo: </label>
                  <input
                    type="checkbox"
                    name="allDay"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    value={editData.allDay}
                  />
                </div>
              </>
            ):(
              <p> Falha no carregamento </p>
            )}

            {/* SELEÇÃO DE ITEMS DINAMICA */}

            <h3> Item(s) para reserva:</h3>

            <div className='items-tab'>
              {HourItem.map((sel, idx) => (
                <div className='selection-item' key={idx}>
                  <label className='Item-Label'>Item {idx + 1}:</label>
                  <select
                    className='select-Items'
                    name={`item${idx + 1}`}
                    required
                    value={sel.name_item}
                    onChange={(e) => editChangeItem(idx, e.target.value)}
                  >
                    {itemSelection.map((item, index) => (
                      <option key={index} value={item}>{item}</option>
                    ))}
                  </select>
                  {idx > 0 && (
                    <button type="button" className='Btn-Remove-Item' onClick={() => editRemoveItem(idx)}>
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" className='Btn-Add-Item' onClick={editAddItem}> Adicionar outro item </button>

            {/* BOTÃO DE CONFIRMAÇÃO DA RESERVA */}
            <button type="submit" className='Btn-Reserva'> Editar Reserva </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Main;
