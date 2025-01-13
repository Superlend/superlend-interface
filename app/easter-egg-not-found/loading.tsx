import MainContainer from "@/components/MainContainer";
import LoadingSectionSkeleton from "@/components/skeletons/LoadingSection";
export default function Loading() {
    return (
        <MainContainer>
            <LoadingSectionSkeleton />
        </MainContainer>
    );
}