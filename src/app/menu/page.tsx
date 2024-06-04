'use client'
import React, {useState, useEffect} from 'react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';


const Menu = () => {
    const [firstDay, setFirstDay] = useState<Date>(new Date());
    const [lastDay, setLastDay] = useState<Date>(new Date());


    useEffect(() => {
        const today = new Date();
        const first = startOfWeek(today, { weekStartsOn: 1 }); // Lundi comme premier jour de la semaine
        const last = endOfWeek(today, { weekStartsOn: 1 }); // Dimanche comme dernier jour de la semaine
        setFirstDay(first);
        setLastDay(last);

    }, [])



    return ( 
        <section>
            <h1>Menu de la semaine du {format(firstDay, 'dd/MM/yyyy', { locale: fr })} au {format(lastDay, 'dd/MM/yyyy', { locale: fr })} </h1>
        </section>
    );
}

export default Menu;