import React from 'react';

const LendingForm: React.FC = () => {
  return (
    <form className="flex flex-col p-3 mt-8 max-w-full rounded-3xl bg-white bg-opacity-40 shadow-[0px_2px_2px_rgba(0,0,0,0.02)] w-[464px]">
      <div className="flex flex-col w-full bg-white rounded-2xl min-h-[148px] max-md:max-w-full">
        <button type="button" className="flex gap-10 justify-between items-center p-6 w-full bg-white rounded-2xl border border-gray-100 border-solid min-h-[80px] shadow-[0px_4px_16px_rgba(0,0,0,0.04)] max-md:px-5 max-md:max-w-full hover:border-gray-400 focus:border-gray-400">
          <label htmlFor="lendingToken" className="self-stretch my-auto text-sm sm:text-md font-medium leading-none text-stone-500">
            Select lending token
          </label>
          <div className="flex gap-1 justify-center items-center self-stretch px-2 my-auto w-8 h-8 rounded-xl border border-gray-100 border-solid bg-neutral-50">
            <img loading="lazy" src="https://cdn.builder.io/api/v1/image/assets/TEMP/00f989f077b46028d448d8135ad466f4a7d9567d2f8758b82ca59769a1882633?placeholderIfAbsent=true&apiKey=689e79da645a41c0a4332461eb09084b" alt="Select token" className="object-contain self-stretch my-auto w-4 aspect-square" />
          </div>
        </button>
        <p className="self-center mt-4 text-sm tracking-normal leading-5 text-center text-stone-500 px-3 sm:w-[35ch]">
          Earn better returns on your assets choose token to see opportunities
        </p>
      </div>
      <button type="submit" className="group flex gap-1 justify-center items-center px-6 py-3.5 mt-5 w-full text-sm font-semibold tracking-normal leading-none text-white uppercase rounded-2xl bg-orange-600 min-h-[44px] max-md:px-5 max-md:max-w-full disabled:opacity-[0.44] disabled:cursor-not-allowed" disabled>
        <span className="self-stretch my-auto group-disabled:opacity-[0.44]">View Opportunities</span>
        <img loading="lazy" src="https://cdn.builder.io/api/v1/image/assets/TEMP/9c5dbfd82534b427e0fe7154827804f183a46b286552c85dbbdde7cc8e3965c0?placeholderIfAbsent=true&apiKey=689e79da645a41c0a4332461eb09084b" alt="" className="object-contain shrink-0 self-stretch my-auto w-4 aspect-square" />
      </button>
    </form>
  );
};

export default LendingForm;