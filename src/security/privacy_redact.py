"""
AegisDrone Security: Dynamic Privacy Anonymization Engine
Enforces DPDP Act & international biometric privacy standards by dynamically blurring
non-watchlist civilians while selectively unmasking verified legal targets.
"""

from typing import List, Dict, Any
import numpy as np
import cv2


class PrivacyRedactionEngine:
    """
    Lawful intercept video privacy filter.
    Protects civilian privacy while preserving tactical evidence on authorized targets.
    """

    def __init__(self, blur_kernel_size: int = 31):
        self.blur_kernel_size = blur_kernel_size if blur_kernel_size % 2 == 1 else blur_kernel_size + 1

    def apply_privacy_filter(
        self,
        frame: np.ndarray,
        detections: List[Dict[str, Any]],
        strict_anonymization: bool = True
    ) -> np.ndarray:
        """
        Processes frame:
        - If strict_anonymization is True, blurs all civilian detections where privacy_unmasked is False.
        - High-value verified targets (privacy_unmasked == True) remain crisp and highlighted.
        """
        output_frame = frame.copy()
        h, w = frame.shape[:2]

        for det in detections:
            u_min = max(0, int(det.get("u_min", 0)))
            v_min = max(0, int(det.get("v_min", 0)))
            u_max = min(w, int(det.get("u_max", 0)))
            v_max = min(h, int(det.get("v_max", 0)))

            if u_max <= u_min or v_max <= v_min:
                continue

            is_unmasked = det.get("privacy_unmasked", False)
            suspect_name = det.get("suspect_name", "CIVILIAN")

            if not is_unmasked and strict_anonymization:
                # Apply heavy Gaussian privacy blur on head/upper region
                crop = output_frame[v_min:v_max, u_min:u_max]
                if crop.size > 0:
                    blurred = cv2.GaussianBlur(crop, (self.blur_kernel_size, self.blur_kernel_size), 0)
                    output_frame[v_min:v_max, u_min:u_max] = blurred
                    # Draw subtle privacy indicator
                    cv2.rectangle(output_frame, (u_min, v_min), (u_max, v_max), (180, 180, 180), 1)
                    cv2.putText(
                        output_frame, "[PROTECTED]", (u_min, max(15, v_min - 4)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, (180, 180, 180), 1, cv2.LINE_AA
                    )
            else:
                # UNMASKED HIGH-VALUE TARGET! Highlight with tactical crosshairs
                cv2.rectangle(output_frame, (u_min, v_min), (u_max, v_max), (0, 0, 255), 2)
                # Tactical corner brackets
                corner_len = min(15, (u_max - u_min) // 3)
                cv2.line(output_frame, (u_min, v_min), (u_min + corner_len, v_min), (0, 255, 255), 2)
                cv2.line(output_frame, (u_min, v_min), (u_min, v_min + corner_len), (0, 255, 255), 2)
                cv2.line(output_frame, (u_max, v_min), (u_max - corner_len, v_min), (0, 255, 255), 2)
                cv2.line(output_frame, (u_max, v_min), (u_max, v_min + corner_len), (0, 255, 255), 2)

                label = f"WARRANT: {suspect_name}"
                cv2.rectangle(output_frame, (u_min, max(0, v_min - 20)), (u_min + len(label) * 9, v_min), (0, 0, 200), -1)
                cv2.putText(
                    output_frame, label, (u_min + 3, v_min - 5),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA
                )

        return output_frame
