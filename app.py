import streamlit as st
import mediapipe as mp
import cv2
import numpy as np
import tempfile
import time
from PIL import Image


mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_pose = mp.solutions.pose
mp_holistic = mp.solutions.holistic

def calc_angle(a,b):
    a = np.array(a)
    b = np.array(b)

    rad = np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = rad*180.0/np.pi
    return angle

st.title("Outdoor Kaki")

st.markdown(
    """
    <style>
    [data-testid="stSidebar"][aria-expanded="true"]>div:first-child{
        width:300px
    }
    [data-testid="stSidebar"][aria-expanded="true"]>div:first-child{
        width:300px
        margin-left: -350px
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.sidebar.title('Menu')
st.sidebar.subheader('Rep Counter')
st.sidebar.subheader('My Profile')
st.text('Hello')

st.set_option('deprecation.showfileUploaderEncoding', False)
use_webcam = st.sidebar.button('Use Webcam')

video_file_buffer = st.sidebar.file_uploader("Upload Video")
tffile = tempfile.NamedTemporaryFile(delete=False)

##Part where we get our input video
if not video_file_buffer:
    if use_webcam:
        vid = cv2.VideoCapture(0)
    else:
        vid = cv2.VideoCapture('IMG_8160.MOV')
else:
    tffile.write(video_file_buffer.read())
    vid = cv2.VideoCapture(tffile.name)

width = int(vid.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(vid.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps_input = int(vid.get(cv2.CAP_PROP_FPS))

#Recording Part
codec = cv2.VideoWriter_fourcc('M', 'J', 'P', 'G')
out = cv2.VideoWriter('output1.mp4', codec, fps_input, (width, height))

if video_file_buffer:
    st.sidebar.text('Input Video')
    st.sidebar.video(tffile.name)

kpi1, kpi2, kpi3 = st.columns(3)

# Curl counter variables
counter = 0
stage = "right"

with kpi1:
    st.markdown("**Frame Rate**")
    kpi1_text = st.markdown("0")

with kpi2:
    st.markdown("**Reps**")
    kpi2_text = st.markdown("0")

with kpi3:
    st.markdown("**Angle**")
    kpi3_text = st.markdown("0")

st.markdown(
    "<hr/>",
    unsafe_allow_html=True,
)

stframe = st.empty()

with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
    while vid.isOpened():
        prevTime = 0
        ret, frame = vid.read()
        if not ret:
            continue

        # Recolor image to RGB
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False

        # Make detection
        results = pose.process(image)

        # Recolor image to RGB
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False

        # Make detection
        results = pose.process(image)

        # Extract landmarks
        try:
            landmarks = results.pose_landmarks.landmark

            # Get coordinates
            shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
                     landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
                        landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
            right_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                         landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
            left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
                          landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
            right_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x,
                           landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]

            # Calculate angle
            right_angle = calc_angle(right_ankle, right_hip)
            left_angle = calc_angle(left_ankle, left_hip)
            avg_angle = (right_angle + left_angle) / 2

            #Render detections
            mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                                      mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2),
                                      mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2)
                                      )

            if avg_angle < 70 and stage == "left":
                stage = "right"
                counter += 1
                print(counter)
            if avg_angle > 115 and stage == 'right':
                stage = "left"
                counter += 1
                print(counter)

        except:
            pass

        currTime = time.time()
        fps = 1/(currTime - prevTime)
        prevTime = currTime

        angle_2dp = "{:.2f}".format(avg_angle)

        kpi1_text.write(f"<h1 style='text-align: center; color:red;'>{int(fps)}</h1>", unsafe_allow_html=True)
        kpi2_text.write(f"<h1 style='text-align: center; color:red;'>{int(counter)}</h1>", unsafe_allow_html=True)
        kpi3_text.write(f"<h1 style='text-align: center; color:red;'>{angle_2dp}</h1>", unsafe_allow_html=True)

        image = cv2.resize(image, (0,0), fx = 0.8, fy = 0.8)
        # image = image_resize(image = image, width = 640)
        stframe.image(image, channels = 'RGB', use_column_width = True)
        # @st.cache()

#
# pTime = 0
# flag = True
#

#
# ## Setup mediapipe instance
# with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
#     while True:
#         if cv2.waitKey(1) & 0xFF == ord('p'):
#             flag = not (flag)
#             print(flag)
#             # Capture frame-by-frame
#
#         if flag == True:
#             ret, frame = cap.read()
#
#             if frame is None:
#                 break
#
#             if ret == True:
#                 frame = cv2.resize(frame, (360, 640))
#             else:
#                 break
#
#             cTime = time.time()
#             fps = 1 / (cTime - pTime)
#             pTime = cTime
#
#             # Recolor image to RGB
#             image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#             image.flags.writeable = False
#
#             # Make detection
#             results = pose.process(image)
#
#             # Recolor back to BGR
#             image.flags.writeable = True
#             image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
#
#             # Extract landmarks
#             try:
#                 landmarks = results.pose_landmarks.landmark
#
#                 # Get coordinates
#                 shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x,
#                             landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
#                 elbow = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x,
#                          landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
#                 wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x,
#                          landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
#                 left_hip = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x,
#                             landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
#                 right_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
#                              landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y]
#                 left_ankle = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x,
#                               landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
#                 right_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x,
#                                landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
#
#                 # Calculate angle
#                 right_angle = calc_angle(right_ankle, right_hip)
#                 left_angle = calc_angle(left_ankle, left_hip)
#                 avg_angle = (right_angle + left_angle) / 2
#
#                 # Render detections
#                 mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
#                                           mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2),
#                                           mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=2)
#                                           )
#
#                 #                 image = cv2.flip(image, 1)
#
#                 # Visualize angle
#                 cv2.putText(image, "{:.2f}".format(avg_angle),
#                             tuple(np.multiply(right_ankle, [360, 480]).astype(int)),
#                             cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2, cv2.LINE_AA
#                             )
#
#                 # counter logic
#                 # set hip as pivot,
#                 # if angle is more than 180 and less than 225, left
#                 # if angle is more than 315 (or around 295) and less than 360, right
#                 # increment by 1 everytime it surpasses
#
#                 if avg_angle < 70 and stage == "left":
#                     stage = "right"
#                     counter += 1
#                     print(counter)
#                 if avg_angle > 115 and stage == 'right':
#                     stage = "left"
#                     counter += 1
#                     print(counter)
#
#                 # Render curl counter
#                 # Setup status box
#                 cv2.rectangle(image, (0, 0), (250, 80), (245, 117, 16), -1)
#
#                 # Rep data
#                 cv2.putText(image, 'REPS', (15, 12),
#                             cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
#                 cv2.putText(image, str(counter),
#                             (10, 60),
#                             cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 2, cv2.LINE_AA)
#
#                 # Stage data
#                 cv2.putText(image, 'STAGE', (65, 12),
#                             cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1, cv2.LINE_AA)
#                 cv2.putText(image, stage,
#                             (80, 60),
#                             cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 2, cv2.LINE_AA)
#
#
#             except:
#                 pass
#
#             cv2.imshow('Mediapipe Feed', image)
#
#             if cv2.waitKey(10) & 0xFF == ord('q'):
#                 break
#
#     cap.release()
#     cv2.destroyAllWindows()