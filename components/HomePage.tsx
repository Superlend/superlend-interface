import React from 'react';
import Header from './Header';
import LendBorrowToggle from './LendBorrowToggle';
import TokenRates from './TokenRates';
import LendingForm from './LendingForm';

const HomePage: React.FC = () => {
    return (
        <main className="">
            <div className="flex flex-col items-center w-full max-w-[1176px] max-md:max-w-full">
                <LendBorrowToggle />
                <TokenRates />
                <LendingForm />
            </div>
        </main>
    );
};

export default HomePage;