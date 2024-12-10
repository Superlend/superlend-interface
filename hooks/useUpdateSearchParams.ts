import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type TNewParams = {
  [key: string]: any;
};

const useUpdateSearchParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateSearchParams = (newParams: TNewParams) => {
    const params = new URLSearchParams(searchParams.toString());

    // Update the parameters based on the newParams object
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Update the URL without reloading the page
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return updateSearchParams;
};

export default useUpdateSearchParams;
