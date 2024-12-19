import React from 'react'

export default function LineGraphBg({
    height,
    width,
    className,
}: {
    height?: number
    width?: number
    className?: string
}) {
    return (
        <svg
            width="382"
            height="164"
            viewBox="0 0 382 164"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${className || ''}`}
        >
            <g opacity="0.6">
                <path
                    d="M221.782 79.5784L196.409 110.277C190.375 117.577 179.327 118.459 170.272 112.364L160.658 105.892C151.86 99.9703 141.138 100.616 134.988 107.438L109.847 135.322C102.672 143.281 89.5541 142.663 80.5756 133.943L69.216 122.91L58.5265 110.533C48.0947 98.4547 30.5799 99.1321 24.8057 111.838L9.84476 144.757C5.5044 154.308 -5.9736 157.518 -16.3326 152.079L-44.7652 137.15C-53.0076 132.822 -62.2305 133.889 -67.8285 139.817L-94.1054 167.645C-98.3703 172.162 -99.9106 178.87 -98.2463 185.679L-82.0169 252.079C-79.1043 263.995 -67.4466 272.635 -56.2056 271.209L456.658 206.127C466.815 204.838 473.206 195.709 471.522 184.892L448.75 38.5717C445.853 19.9591 422.973 10.3698 411.809 23.0896L384.008 54.7651C377.845 61.7864 366.916 62.4565 358.016 56.3588L328.802 36.342C319.302 29.8331 307.61 31.0857 301.778 39.2372L272.235 80.5294C266.605 88.3975 254.692 88.3555 246.712 80.4394C239.051 72.8404 227.676 72.4475 221.782 79.5784Z"
                    fill="url(#paint0_linear_2267_6210)"
                    stroke="url(#paint1_linear_2267_6210)"
                    strokeWidth="0.87345"
                />
                <path
                    d="M221.782 79.5784L196.409 110.277C190.375 117.577 179.327 118.459 170.272 112.364L160.658 105.892C151.86 99.9703 141.138 100.616 134.988 107.438L109.847 135.322C102.672 143.281 89.5541 142.663 80.5756 133.943L69.216 122.91L58.5265 110.533C48.0947 98.4547 30.5799 99.1321 24.8057 111.838L9.84476 144.757C5.5044 154.308 -5.9736 157.518 -16.3326 152.079L-44.7652 137.15C-53.0076 132.822 -62.2305 133.889 -67.8285 139.817L-94.1054 167.645C-98.3703 172.162 -99.9106 178.87 -98.2463 185.679L-82.0169 252.079C-79.1043 263.995 -67.4466 272.635 -56.2056 271.209L456.658 206.127C466.815 204.838 473.206 195.709 471.522 184.892L448.75 38.5717C445.853 19.9591 422.973 10.3698 411.809 23.0896L384.008 54.7651C377.845 61.7864 366.916 62.4565 358.016 56.3588L328.802 36.342C319.302 29.8331 307.61 31.0857 301.778 39.2372L272.235 80.5294C266.605 88.3975 254.692 88.3555 246.712 80.4394C239.051 72.8404 227.676 72.4475 221.782 79.5784Z"
                    fill="url(#paint2_linear_2267_6210)"
                    stroke="url(#paint3_linear_2267_6210)"
                    strokeWidth="2"
                />
            </g>
            <circle cx="314" cy="32" r="3" fill="#2775CA" />
            <circle
                cx="314"
                cy="32"
                r="4.5"
                stroke="#2775CA"
                strokeOpacity="0.2"
                strokeWidth="3"
            />
            <defs>
                <linearGradient
                    id="paint0_linear_2267_6210"
                    x1="382.58"
                    y1="31.691"
                    x2="290.741"
                    y2="182.819"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#2775CA" stopOpacity="0.2" />
                    <stop offset="1" stopColor="#2775CA" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                    id="paint1_linear_2267_6210"
                    x1="333.673"
                    y1="40.5567"
                    x2="222.122"
                    y2="252.83"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#2775CA" />
                    <stop
                        offset="0.556304"
                        stopColor="#2775CA"
                        stopOpacity="0"
                    />
                </linearGradient>
                <linearGradient
                    id="paint2_linear_2267_6210"
                    x1="382.58"
                    y1="31.691"
                    x2="290.741"
                    y2="182.819"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#2775CA" stopOpacity="0.2" />
                    <stop offset="1" stopColor="#2775CA" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                    id="paint3_linear_2267_6210"
                    x1="333.673"
                    y1="40.5567"
                    x2="222.122"
                    y2="252.83"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#2775CA" />
                    <stop
                        offset="0.556304"
                        stopColor="#2775CA"
                        stopOpacity="0"
                    />
                </linearGradient>
            </defs>
        </svg>
    )
}

// YELLOW GRAPH BG
{
    /* <svg width="382" height="164" viewBox="0 0 382 164" fill="none" xmlns="http://www.w3.org/2000/svg">
<g opacity="0.6">
<path d="M222.449 79.5784L197.076 110.277C191.042 117.577 179.994 118.459 170.939 112.364L161.325 105.892C152.527 99.9703 141.805 100.616 135.655 107.438L110.514 135.322C103.339 143.281 90.2211 142.663 81.2426 133.943L69.883 122.91L59.1935 110.533C48.7617 98.4547 31.2469 99.1321 25.4727 111.838L10.5118 144.757C6.17139 154.308 -5.30661 157.518 -15.6657 152.079L-44.0983 137.15C-52.3406 132.822 -61.5635 133.889 -67.1615 139.817L-93.4384 167.645C-97.7033 172.162 -99.2436 178.87 -97.5793 185.679L-81.3499 252.079C-78.4373 263.995 -66.7796 272.635 -55.5386 271.209L457.324 206.127C467.482 204.838 473.873 195.709 472.189 184.892L449.417 38.5717C446.52 19.9591 423.64 10.3698 412.476 23.0896L384.675 54.7651C378.512 61.7864 367.583 62.4565 358.683 56.3588L329.469 36.342C319.969 29.8331 308.277 31.0857 302.445 39.2372L272.902 80.5294C267.272 88.3975 255.359 88.3555 247.379 80.4394C239.718 72.8404 228.343 72.4475 222.449 79.5784Z" fill="url(#paint0_linear_2267_6199)" stroke="url(#paint1_linear_2267_6199)" strokeWidth="0.87345"/>
<path d="M222.449 79.5784L197.076 110.277C191.042 117.577 179.994 118.459 170.939 112.364L161.325 105.892C152.527 99.9703 141.805 100.616 135.655 107.438L110.514 135.322C103.339 143.281 90.2211 142.663 81.2426 133.943L69.883 122.91L59.1935 110.533C48.7617 98.4547 31.2469 99.1321 25.4727 111.838L10.5118 144.757C6.17139 154.308 -5.30661 157.518 -15.6657 152.079L-44.0983 137.15C-52.3406 132.822 -61.5635 133.889 -67.1615 139.817L-93.4384 167.645C-97.7033 172.162 -99.2436 178.87 -97.5793 185.679L-81.3499 252.079C-78.4373 263.995 -66.7796 272.635 -55.5386 271.209L457.324 206.127C467.482 204.838 473.873 195.709 472.189 184.892L449.417 38.5717C446.52 19.9591 423.64 10.3698 412.476 23.0896L384.675 54.7651C378.512 61.7864 367.583 62.4565 358.683 56.3588L329.469 36.342C319.969 29.8331 308.277 31.0857 302.445 39.2372L272.902 80.5294C267.272 88.3975 255.359 88.3555 247.379 80.4394C239.718 72.8404 228.343 72.4475 222.449 79.5784Z" fill="url(#paint2_linear_2267_6199)" stroke="url(#paint3_linear_2267_6199)" strokeWidth="2"/>
</g>
<circle cx="314.667" cy="32" r="3" fill="#F7931A"/>
<circle cx="314.667" cy="32" r="4.5" stroke="#F7931A" strokeOpacity="0.2" strokeWidth="3"/>
<defs>
<linearGradient id="paint0_linear_2267_6199" x1="383.247" y1="31.691" x2="291.408" y2="182.819" gradientUnits="userSpaceOnUse">
<stop stopColor="#F7931A" stopOpacity="0.2"/>
<stop offset="1" stopColor="#F7931A" stopOpacity="0"/>
</linearGradient>
<linearGradient id="paint1_linear_2267_6199" x1="334.34" y1="40.5567" x2="222.789" y2="252.83" gradientUnits="userSpaceOnUse">
<stop stopColor="#F7931A"/>
<stop offset="0.556304" stopColor="#F7931A" stopOpacity="0"/>
</linearGradient>
<linearGradient id="paint2_linear_2267_6199" x1="383.247" y1="31.691" x2="291.408" y2="182.819" gradientUnits="userSpaceOnUse">
<stop stopColor="#F7931A" stopOpacity="0.2"/>
<stop offset="1" stopColor="#F7931A" stopOpacity="0"/>
</linearGradient>
<linearGradient id="paint3_linear_2267_6199" x1="334.34" y1="40.5567" x2="222.789" y2="252.83" gradientUnits="userSpaceOnUse">
<stop stopColor="#F7931A"/>
<stop offset="0.556304" stopColor="#F7931A" stopOpacity="0"/>
</linearGradient>
</defs>
</svg> */
}

// GREEN GRAPH BG
{
    /* <svg width="382" height="164" viewBox="0 0 382 164" fill="none" xmlns="http://www.w3.org/2000/svg">
<g opacity="0.6">
<path d="M223.115 79.5784L197.742 110.277C191.708 117.577 180.66 118.459 171.605 112.364L161.991 105.892C153.193 99.9703 142.471 100.616 136.321 107.438L111.18 135.322C104.005 143.281 90.8871 142.663 81.9086 133.943L70.549 122.91L59.8596 110.533C49.4277 98.4547 31.9129 99.1321 26.1387 111.838L11.1778 144.757C6.83741 154.308 -4.64059 157.518 -14.9996 152.079L-43.4322 137.15C-51.6746 132.822 -60.8974 133.889 -66.4955 139.817L-92.7724 167.645C-97.0373 172.162 -98.5776 178.87 -96.9133 185.679L-80.6839 252.079C-77.7713 263.995 -66.1136 272.635 -54.8726 271.209L457.991 206.127C468.148 204.838 474.539 195.709 472.855 184.892L450.083 38.5717C447.186 19.9591 424.306 10.3698 413.142 23.0896L385.341 54.7651C379.178 61.7864 368.249 62.4565 359.349 56.3588L330.135 36.342C320.635 29.8331 308.943 31.0857 303.111 39.2372L273.568 80.5294C267.938 88.3975 256.025 88.3555 248.045 80.4394C240.384 72.8404 229.009 72.4475 223.115 79.5784Z" fill="url(#paint0_linear_2267_6200)" stroke="url(#paint1_linear_2267_6200)" strokeWidth="0.87345"/>
<path d="M223.115 79.5784L197.742 110.277C191.708 117.577 180.66 118.459 171.605 112.364L161.991 105.892C153.193 99.9703 142.471 100.616 136.321 107.438L111.18 135.322C104.005 143.281 90.8871 142.663 81.9086 133.943L70.549 122.91L59.8596 110.533C49.4277 98.4547 31.9129 99.1321 26.1387 111.838L11.1778 144.757C6.83741 154.308 -4.64059 157.518 -14.9996 152.079L-43.4322 137.15C-51.6746 132.822 -60.8974 133.889 -66.4955 139.817L-92.7724 167.645C-97.0373 172.162 -98.5776 178.87 -96.9133 185.679L-80.6839 252.079C-77.7713 263.995 -66.1136 272.635 -54.8726 271.209L457.991 206.127C468.148 204.838 474.539 195.709 472.855 184.892L450.083 38.5717C447.186 19.9591 424.306 10.3698 413.142 23.0896L385.341 54.7651C379.178 61.7864 368.249 62.4565 359.349 56.3588L330.135 36.342C320.635 29.8331 308.943 31.0857 303.111 39.2372L273.568 80.5294C267.938 88.3975 256.025 88.3555 248.045 80.4394C240.384 72.8404 229.009 72.4475 223.115 79.5784Z" fill="url(#paint2_linear_2267_6200)" stroke="url(#paint3_linear_2267_6200)" strokeWidth="2"/>
</g>
<circle cx="315.333" cy="32" r="3" fill="#26A17B"/>
<circle cx="315.333" cy="32" r="4.5" stroke="#26A17B" strokeOpacity="0.2" strokeWidth="3"/>
<defs>
<linearGradient id="paint0_linear_2267_6200" x1="383.913" y1="31.691" x2="292.074" y2="182.819" gradientUnits="userSpaceOnUse">
<stop stopColor="#26A17B" stopOpacity="0.2"/>
<stop offset="1" stopColor="#26A17B" stopOpacity="0"/>
</linearGradient>
<linearGradient id="paint1_linear_2267_6200" x1="335.006" y1="40.5567" x2="223.455" y2="252.83" gradientUnits="userSpaceOnUse">
<stop stopColor="#26A17B"/>
<stop offset="0.556304" stopColor="#26A17B" stopOpacity="0"/>
</linearGradient>
<linearGradient id="paint2_linear_2267_6200" x1="383.913" y1="31.691" x2="292.074" y2="182.819" gradientUnits="userSpaceOnUse">
<stop stopColor="#26A17B" stopOpacity="0.2"/>
<stop offset="1" stopColor="#26A17B" stopOpacity="0"/>
</linearGradient>
<linearGradient id="paint3_linear_2267_6200" x1="335.006" y1="40.5567" x2="223.455" y2="252.83" gradientUnits="userSpaceOnUse">
<stop stopColor="#26A17B"/>
<stop offset="0.556304" stopColor="#26A17B" stopOpacity="0"/>
</linearGradient>
</defs>
</svg> */
}
