import { arimo } from "@/lib/fonts";

const PreviewSection = () => {
    return (
        <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm">
            <h3 className="text-base text-dark mb-[24px]">Preview</h3>
            <div className="space-y-4">
                <div className="w-[113px] h-[46px] bg-[#E5E5E5] flex items-center justify-center rounded">
                    <span className="text-gray-500 text-base font-semibold">Your Logo</span>
                </div>
                <h1 className={`text-2xl md:text-[37px] ${arimo.className}`} style={{ color: '#00FF7B' }}>Welcome to Our Restaurant</h1>
                <p className="text-base" style={{ color: '#030401' }}>
                    Experience the finest dining with our carefully curated menu. Order online for delivery or pickup.
                </p>
                <div className="flex items-center gap-4 font-bold">
                    <span
                        className="px-5 h-[41px] flex items-center justify-center text-sm rounded-[10px]"
                        style={{ backgroundColor: "#00FF7B", color: "white" }}
                    >
                        Featured
                    </span>

                    <span
                        className="px-5 h-[41px] flex items-center justify-center text-sm rounded-[10px]"
                        style={{ backgroundColor: "#F59E0B", color: "white" }}
                    >
                        New
                    </span>

                    <span className="px-5 h-[41px] flex items-center justify-center text-sm rounded-[10px] border border-dark">
                        Popular
                    </span>
                </div>

            </div>
        </div>
    );
};

export default PreviewSection;
