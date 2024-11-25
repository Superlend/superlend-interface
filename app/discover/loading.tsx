import MainContainer from "@/components/MainContainer";
import LoadingSectionSkeleton from "@/components/skeletons/LoadingSection";

export default function Loading() {
    return (
        <MainContainer>
            <LoadingSectionSkeleton className="h-[300px] md:h-[400px]" />
        </MainContainer>
    )
}