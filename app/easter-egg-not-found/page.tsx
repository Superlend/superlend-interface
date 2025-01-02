/* eslint-disable @next/next/no-img-element */
import MainContainer from "@/components/MainContainer";
const EasterEggNotFound = () => {
    return (
        <MainContainer>
            <div className="w-full flex justify-center">
                <img
                    src="/images/easter-egg-not-found.jpg"
                    alt="easter-egg-not-found"
                    className="rounded border-2"
                />
            </div>
        </MainContainer>
    );
};
export default EasterEggNotFound;