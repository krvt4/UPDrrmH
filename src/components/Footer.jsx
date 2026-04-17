import React, { useEffect, useState } from 'react';
import UPLogo from '../assets/UP.png';
import UPDrrm from '../assets/updrrm.png';
import UPNAME from '../assets/dname-yw-v2.png';
import { MapPinned, PhoneCall, Mail } from 'lucide-react';

function Footer() {
    const [visitCount, setVisitCount] = useState(0);

    // Track total visits using localStorage
    useEffect(() => {
        const count = localStorage.getItem('visitCount');
        const newCount = count ? parseInt(count) + 1 : 1;
        localStorage.setItem('visitCount', newCount);
        setVisitCount(newCount);
    }, []);

    return (
        <footer className="bg-red-900 text-white">
            <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                    
                    {/* Contact Section */}
                    <div className="space-y-6 text-white mx-auto">
                        <div className="flex items-center justify-center gap-2">
                            <img src={UPLogo} alt="UP Logo" className="h-8 lg:h-14 w-auto" />
                            <img src={UPDrrm} alt="UPDRRM Logo" className="h-8 lg:h-14 w-auto" />
                            <div className="border-l-2 border-white h-10 lg:h-14"></div>
                            <img src={UPNAME} alt="DNAME Logo" className="h-10 lg:h-14 w-auto" />
                        </div>

                        <div className="space-y-3">
                            <a href="https://www.google.com/maps/place/670+Padre+Faura+St,+Ermita,+Manila,+1000+Metro+Manila/@14.5768159,120.9805563,21z/data=!4m10!1m2!2m1!1s670+Padre+Faura+St,+Ermita,+Manila,+1000+Metro+Manila!3m6!1s0x3397ca2edef4ca1d:0x2e219592a918b2e8!8m2!3d14.576844!4d120.980658!15sCjU2NzAgUGFkcmUgRmF1cmEgU3QsIEVybWl0YSwgTWFuaWxhLCAxMDAwIE1ldHJvIE1hbmlsYZIBCnN1YnByZW1pc2XgAQA!16s%2Fg%2F11rg5y2mzk?entry=ttu&g_ep=EgoyMDI1MDQyOS4wIKXMDSoASAFQAw%3D%3D"
                            className="flex items-center text-sm">
                                <MapPinned size={30} className='mr-2'/>
                                670 Padre Faura St, Ermita, Manila, 1000 Metro Manila
                            </a>
                            <p className="flex items-center text-sm">
                                <PhoneCall size={25} className='mr-2'/>
                                123-6921-08
                            </p>
                            
                            <a href="https://mail.google.com/mail/u/0/#inbox?compose=DmwnWtMmVndXxwPCTwvfqHLTnGNVpVzDwXVqncGDVmpVZjMXCjBhPVlGXNGGCSQkTXVDlhDNMTJl" className="flex items-center text-sm">
                                <Mail size={25} className="mr-2"/>
                                upm-drrmh-list@up.edu.ph
                            </a>
                        </div>
                    </div>

                    {/* Newsletter Section */}
                    <div className="space-y-4 text-center md:text-left">
                        <h2 className="font-bold text-white">Be Updated!</h2>
                        <p className="text-gray-300">Stay in the loop and sign up for the UP DRRM-H Program newsletter:</p>
                        <div className="flex items-center bg-white border rounded-xl shadow-md overflow-hidden">
                            <input type="email" placeholder="Enter your email" className="flex-1 px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none"/>
                            <button className="bg-red-900 text-white p-3 justify-center items-center rounded-full w-10 h-10 hover:bg-red-800 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-2" />
                <div className="sm:flex sm:items-center sm:justify-between">
                    <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
                        <a href="https://flowbite.com/" className="hover:underline">© UP MANILA DRRM-H PROGRAM</a>. All Rights Reserved 2025.
                    </span>
                    <div className="flex mt-4 sm:justify-center sm:mt-0 space-x-6">
                        <a href="#" className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                            Terms & Conditions
                        </a>
                        <span className="text-sm text-gray-500">|</span>
                        <span className="text-sm text-gray-500">
                            Total Visits: <strong>{visitCount}</strong>
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
