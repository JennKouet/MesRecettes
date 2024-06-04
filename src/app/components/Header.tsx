"use client"
import React from 'react';
import Link from 'next/link'

const Header = () => {

    const allMenus = [
        {name: "Accueil", link: "/"},
        {name: "Menu", link: "/menu"},
    ]

    return (
        <nav className='w-full flex flex-col items-center px-6'>
            <div className='flex flex-col w-full lg:w-2/3'>
                <div className='flex flex-row justify-between'>
                    <h1>Mes Recettes</h1>
                    <ul className='md:flex md:flex-row md:justify-around md:items-center hidden'>
                        {allMenus.map((menu, index) => (
                            <li className='p-4' key={index}>
                                <Link href={menu.link} className='nav-title'>{menu.name}</Link>
                            </li>
                        ))
                        }
                    </ul>
                </div>
                <hr className="blue-line"/>
                <ul className='flex flex-row justify-around items-center md:hidden'>
                    {allMenus.map((menu, index) => (
                        <li className='p-2' key={index}>
                            <Link href={menu.link} className='nav-small-title'>{menu.name}</Link>
                        </li>
                    ))
                    }
                </ul>
            </div>
        </nav>
    )

}

export default Header;