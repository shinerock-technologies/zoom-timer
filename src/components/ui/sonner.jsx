import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#2d2d2d] group-[.toaster]:text-white group-[.toaster]:border-[#3d3d3d] group-[.toaster]:shadow-lg gap-4",
          description: "group-[.toast]:text-[#888]",
          actionButton:
            "group-[.toast]:bg-[#3d3d3d] group-[.toast]:text-white group-[.toast]:border group-[.toast]:border-[#4d4d4d] group-[.toast]:hover:bg-[#4d4d4d] !ml-3 !mr-0",
          cancelButton:
            "group-[.toast]:bg-[#2d8cff] group-[.toast]:text-white group-[.toast]:hover:bg-[#1a73e8] !ml-3 !mr-0",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
