import React, { useState, useEffect, use } from 'react';

// NAVEGAÇÃO ENTRE PÁGINAS
import { useNavigate } from 'react-router-dom';

// ESTILIZAÇÃO DA PÁGINA
import './Calendar.css';

// FUNÇÕES DE CONSULTA AO BANCO DE DADOS
import { InsertReservation, LoadReservations } from '../../db/queries';

// BIBLIOTECA RESPONSÁVEL PELOS MODAIS
import Modal from "react-modal";

// BIBLIOTECA RESPONSÁVEIS PELO CALENDÁRIO
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'moment/locale/pt-br';

// BIBLIOTECAS DE ICONES PARA FRONT-END
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faUser } from "@fortawesome/free-solid-svg-icons";

moment.locale('pt-br');
Modal.setAppElement('#root');

// TRADUÇÃO DO CALENDÁRIO PARA PORTUGUÊS
const messages = {
  allDay: 'Dia todo',
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
  noEventsInRange: 'Nenhum evento neste período.',
};

const localizer = momentLocalizer(moment);

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
  const [rows, setRows] = useState([]);

  // ESTADOS DO CALENDÁRIO
  const [events, setEvents] = useState([]);

  // DATA SELECIONADA E EVENTOS DO DIA
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayEvents, setDayEvents] = useState([]);

  // ESTADO QUE GUARDA AS RESERVAS CARREGADAS DO BANCO DE DADOS
  const [reservationData, setReservationData] = useState([]);

  // OPÇÕES DE ITENS PARA RESERVA
  const [itemSelection, setItemSelection] = useState([
    'Cabo HDMI', 'Cabo VGA', 'Cabo fonte', 'Cabo de Rede'
  ]);

  // ESTADO DOS ITENS SELECIONADOS
  const [selectedItems, setSelectedItems] = useState([itemSelection[0] || '']);

  // CONTROLA SE A RESERVA É O DIA TODO
  const [isAllDay, setIsAllDay] = useState(false);

  // FUNÇÃO QUE ENVIA A RESERVA PARA O BANCO DE DADOS
  const ReservationSubmit = (e) => {
    // PREVINE O RECARREGAMENTO DA PÁGINA
    e.preventDefault();

    // COLETA OS DADOS DO FORMULÁRIO
    const form = e.target;
    const fd = new FormData(form);

    const startTime = fd.get('startTime');
    const endTime = fd.get('endTime');
    const allDayChecked = fd.get('allDay') !== null;

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
      startTime: allDayChecked ? null : startTime,
      endTime: allDayChecked ? null : endTime,
      allDay: allDayChecked,
      items: items
    };

    InsertReservation(reservation);
  }

  // Função que emite o modal dos horários do dia clicado no calendário
  const DateSelect = (slotInfo) => {
    const date = slotInfo.start instanceof Date ? slotInfo.start : new Date(slotInfo.start);
    const eventsOfDay = events.filter(
      (ev) =>
        moment(ev.start).isSame(date, 'day') ||
        (ev.start < date && ev.end >= date)
    );
    setSelectedDate(date);
    setDayEvents(eventsOfDay);
    setModalDateIsOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    navigate('/login');  // This will redirect to the root/login page
  };

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

  const handleRemoveItem = (index) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  }

  // carrega reservas do servidor ao montar e adiciona ao calendário
  useEffect(() => {
    const loadReservations = async () => {
      try {
        // Aguarda o resultado da função LoadReservations
        const reservations = await LoadReservations();
        setRows(reservations); // Atualiza o estado com as reservas carregadas

        const dbEvents = reservations.map(r => {
          const date = r.date_reservation || r.date || r.date_reserve || null;
          const allDay = Number(r.all_day) === 1 || r.allDay === true;

          const parseDateTime = (d, t) => {
            if (!d) return null;
            if (!t) return moment(d, 'YYYY-MM-DD').toDate();
            return moment(`${d} ${t}`, 'YYYY-MM-DD HH:mm').toDate();
          };

          const start = allDay
            ? (date ? moment(date, 'YYYY-MM-DD').startOf('day').toDate() : new Date())
            : parseDateTime(date, r.inicial_hour || r.startTime);

          const end = allDay
            ? (date ? moment(date, 'YYYY-MM-DD').endOf('day').toDate() : new Date())
            : parseDateTime(date, r.final_hour || r.endTime);

          return {
            title: r.name_reservation || r.title || `Reserva ${r.userName || ''}`,
            start: start || new Date(),
            end: end || start || new Date(),
            allDay
          };
        });

        setEvents(prev => {
          const key = ev => `${ev.title}_${+new Date(ev.start)}`;
          const existingKeys = new Set(prev.map(key));
          const merged = [...prev];
          dbEvents.forEach(e => {
            if (!existingKeys.has(key(e))) merged.push(e);
          });
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
            messages={messages}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={['month']}
            selectable
            onSelectSlot={DateSelect}
            onSelectEvent={DateSelect}
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

      <Modal isOpen={ModalDateIsOpen} onRequestClose={() => setModalDateIsOpen(false)}>
        <div className='Modal-Bar'>
          <h2 className='Hour-Style'>
            Eventos em {selectedDate ? moment(selectedDate).format('DD/MM/YYYY') : '...'}
          </h2>
          <button onClick={() => setModalDateIsOpen(false)} className='Modal-Btn-Close'>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className='Hour-Calendar'>
          <Calendar
            localizer={localizer}
            messages={messages}
            events={dayEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 470, width: 600 }}
            views={['day']}
            defaultView="day"
            step={60}       // intervalos de 30 minutos
            timeslots={1}
            toolbar={false}
            date={selectedDate}
          />
          <button className='Btn-Reserva' onClick={() => setIsInsertModalOpen(true)}>
            Adicionar Reserva
          </button>
        </div>
      </Modal>

      {/* MODAL RESPONSÁVEL PARA INSERÇÃO DA RESERVA AO CALENDÁRIO */}
      <Modal isOpen={isInsertModalOpen} onRequestClose={() => setIsInsertModalOpen(false)} className="Modal-Insert">
        <div className='Modal-Bar'>
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
            <label> Horário Inicial: </label>
            <input
              type="time"
              name="startTime"
              required
              className='insert-input'
              disabled={isAllDay}
            />
            <label> Horário Final: </label>
            <input
              type="time"
              name="endTime"
              required
              className='insert-input'
              disabled={isAllDay}
            />
            <div className='allDay-Format'>
              <label> Dia todo: </label>
              <input
                type="checkbox"
                name="allDay"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
              />
            </div>

            {/* SELEÇÃO DE ITEMS DINAMICA */}

            <h3> Item(s) para reservar:</h3>

            <div className='items-tab'>
              {selectedItems.map((sel, idx) => (
                <div className='selection-item' key={idx}>
                  <label>Item {idx + 1}:</label>
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
            <button type="submit" className='Btn-Reserva'> Confirmar Reserva </button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Main;
