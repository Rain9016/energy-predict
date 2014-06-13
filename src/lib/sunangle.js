////////////////////////////////////////////////////////////
//  UTILITY FUNCTIONS
////////////////////////////////////////////////////////////

function parse_time(inputString) {

	// Check for a semi-colon in time.
	if (inputString.substring (1,2) == ":") {
		return (inputString.substring(0,1) + inputString.substring(2,4));
		}

	if (inputString.substring (2,3) == ":") {
		return (inputString.substring(0,2) + inputString.substring(3,5));
		}

	return (inputString);

	}

////////////////////////////////////////////////////////////
//  COMPUTE FUNCTIONS
////////////////////////////////////////////////////////////
//tzone = 1.0 for +1.0
// return: out[0] => sun altitude
// 		   out[1] => sun azimuth
function compute_angle(lat,long,tzone,date) {

	// Location in radians.
	var	fLatitude;
	var	fLongitude;
	var	fTimeZone;

	// Calculated data.
	var	fDifference;
	var	fDeclination;
	var	fEquation;

	// Solar information.
	var	fLocalTime;
	var	fSolarTime;
	var	fAltitude;
	var	fAzimuth;
	var	fSunrise;
	var	fSunset;

	// Integer values.
	var iJulianDate;

	// Temp data.
	var t, m, hour, minute, test;

	////////////////////////////////////////////////////////////
	// READ INPUT DATA 
	////////////////////////////////////////////////////////////

	// Get location data.
	fLatitude = parseFloat(lat) * (Math.PI/180.0);
	fTimeZone = parseFloat(tzone) * 15 * (Math.PI/180.0);
	fLongitude = parseFloat(long) * (Math.PI/180.0);


	var now = new Date(date+'+0200');
	var start = new Date(now.getFullYear(), 0, 0);
	var diff = now - start;
	var oneDay = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff / oneDay);	

	// Get julian date.
	iJulianDate = day;
	
	// Get local time value.
	fLocalTime = parseFloat(parse_time(now.getHours() + ':' + (now.getMinutes()<10?'0':'') + now.getMinutes()));

	// Check for military time (2400).
	if (fLocalTime > 100) {
		fLocalTime /= 100.0;
		t = Math.floor(fLocalTime);
		m = Math.round((fLocalTime - t) * 100.0);
		fLocalTime = t + (m / 60.0);
	}


	////////////////////////////////////////////////////////////
	// CALCULATE SOLAR VALUES
	////////////////////////////////////////////////////////////

	// Preliminary check.
	if (iJulianDate > 365) iJulianDate -= 365;
	if (iJulianDate < 0) iJulianDate += 365;

	// Secondary check of julian date.
	if (iJulianDate > 365) iJulianDate = 365;
	if (iJulianDate < 1) iJulianDate = 1;

	// Calculate solar declination as per Carruthers et al.
	t = 2 * Math.PI * ((iJulianDate - 1) / 365.0);

	fDeclination = (0.322003
		  - 22.971 * Math.cos(t)
		  - 0.357898 * Math.cos(2*t)
		  - 0.14398 * Math.cos(3*t)
		  + 3.94638 * Math.sin(t)
		  + 0.019334 * Math.sin(2*t)
		  + 0.05928 * Math.sin(3*t)
		  );

	// Convert degrees to radians.
	if (fDeclination > 89.9) fDeclination = 89.9;
	if (fDeclination < -89.9) fDeclination = -89.9;

	// Convert to radians.
	fDeclination = fDeclination * (Math.PI/180.0);

	// Calculate the equation of time as per Carruthers et al.
	t = (279.134 + 0.985647 * iJulianDate) * (Math.PI/180.0);

	fEquation = (5.0323
		  - 100.976 * Math.sin(t)
		  + 595.275 * Math.sin(2*t)
		  + 3.6858 * Math.sin(3*t)
		  - 12.47 * Math.sin(4*t)
		  - 430.847 * Math.cos(t)
		  + 12.5024 * Math.cos(2*t)
		  + 18.25 * Math.cos(3*t)
		  );

	// Convert seconds to hours.
	fEquation = fEquation / 3600.00;

	// Calculate difference (in minutes) from reference longitude.
	fDifference = (((fLongitude - fTimeZone) * 180/Math.PI) * 4) / 60.0;

	// Convert solar noon to local noon.
	local_noon = 12.0 - fEquation - fDifference;

	// Calculate angle normal to meridian plane.
	if (fLatitude > (0.99 * (Math.PI/2.0))) fLatitude = (0.99 * (Math.PI/2.0));
  	if (fLatitude < -(0.99 * (Math.PI/2.0))) fLatitude = -(0.99 * (Math.PI/2.0));

	test = -Math.tan(fLatitude) * Math.tan(fDeclination);

	if (test < -1) t = Math.acos(-1.0) / (15 * (Math.PI / 180.0));
	// else if (test > 1) t = acos(1.0) / (15 * (Math.PI / 180.0)); ### Correction - missing 'Math.acos'
	else if (test > 1) t = Math.acos(1.0) / (15 * (Math.PI / 180.0));
	else t = Math.acos(-Math.tan(fLatitude) * Math.tan(fDeclination)) / (15 * (Math.PI / 180.0));

	// Sunrise and sunset.
	fSunrise = local_noon - t;
	fSunset  = local_noon + t;
	
	// Check validity of local time.
	if (fLocalTime > fSunset) fLocalTime = fSunset;
	if (fLocalTime < fSunrise) fLocalTime = fSunrise;
	if (fLocalTime > 24.0) fLocalTime = 24.0;
	if (fLocalTime < 0.0) fLocalTime = 0.0;

	// Caculate solar time.
	fSolarTime = fLocalTime + fEquation + fDifference;

	// Calculate hour angle.
	fHourAngle = (15 * (fSolarTime - 12)) * (Math.PI/180.0);

	// Calculate current altitude.
	t = (Math.sin(fDeclination) * Math.sin(fLatitude)) + (Math.cos(fDeclination) * Math.cos(fLatitude) * Math.cos(fHourAngle));
	fAltitude = Math.asin(t);

	// Original calculation of current azimuth - LEAVE COMMENTED AS DOES NOT WORK CORRECTLY.
	// t = (Math.cos(fLatitude) * Math.sin(fDeclination)) - (Math.cos(fDeclination) * Math.sin(fLatitude) * Math.cos(fHourAngle));
	// fAzimuth = Math.acos(t / Math.cos(fAltitude));

	// FIX:
	// ##########################################
	// Need to do discrete quadrant checking.

	// Calculate current azimuth.
	t = (Math.sin(fDeclination) * Math.cos(fLatitude))
	  - (Math.cos(fDeclination) * Math.sin(fLatitude)
	  *  Math.cos(fHourAngle));

	// Avoid division by zero error.
	if (fAltitude < (Math.PI/2.0)) { 
		sin1 = (-Math.cos(fDeclination) * Math.sin(fHourAngle)) / Math.cos(fAltitude);
		cos2 = t / Math.cos(fAltitude);
		}

	else {
		sin1 = 0.0;
		cos2 = 0.0;
		}

	// Some range checking.
	if (sin1 > 1.0) sin1 = 1.0;
	if (sin1 < -1.0) sin1 = -1.0;
	if (cos2 < -1.0) cos2 = -1.0;
	if (cos2 > 1.0) cos2 = 1.0;

	// Calculate azimuth subject to quadrant.
	if (sin1 < -0.99999) fAzimuth = Math.asin(sin1);

	else if ((sin1 > 0.0) && (cos2 < 0.0)) {
		if (sin1 >= 1.0) fAzimuth = -(Math.PI/2.0);
		else fAzimuth = (Math.PI/2.0) + ((Math.PI/2.0) - Math.asin(sin1));
		}

	else if ((sin1 < 0.0) && (cos2 < 0.0)) {
		if (sin1 <= -1.0) fAzimuth = (Math.PI/2.0);
		else fAzimuth = -(Math.PI/2.0) - ((Math.PI/2.0) + Math.asin(sin1));
		}

	else fAzimuth = Math.asin(sin1);

	// A little last-ditch range check.
	if ((fAzimuth < 0.0) && (fLocalTime < 10.0)) {
		fAzimuth = -fAzimuth;
		}

	////////////////////////////////////////////////////////////
	// FORMAT OUTPUT DATA
	////////////////////////////////////////////////////////////

	// Update local time.
	/*t = Math.floor(fLocalTime);
	m = Math.floor((fLocalTime - t) * 60.0);
	if (m < 10) minute = "0" + m; else minute = m;
	if (t < 10) hour = "0" + t; else hour = t;
	document.theForm.inputTime.value = hour + ":" + minute;*/

	// Output declination.
	/*t = Math.round((fDeclination * (180 / Math.PI)) * 1000) / 1000.0;
	document.theForm.outputDeclination.value = t;*/

	// Output equation of time.
	/*t = Math.round((fEquation * 60.0) * 1000) / 1000.0;
	document.theForm.outputEOT.value = t;*/

	var out = [];
	// Output altitude value.
	t = Math.round(fAltitude * (180.0/Math.PI) * 100) / 100.0;
	out[0] = t;

	// Output aziumth value.
	t = Math.round(fAzimuth * (180.0/Math.PI) * 100) / 100.0;
	out[1] = t;

	// Output solar time.
	/*t = Math.floor(fSolarTime);
	m = Math.floor((fSolarTime - t) * 60.0);
	if (m < 10) minute = "0" + m; else minute = m;
	if (t < 10) hour = "0" + t; else hour = t;
	document.theForm.outputSolarTime.value = hour + ":" + minute;

	// Output sunrise time.
	t = Math.floor(fSunrise);
	m = Math.floor((fSunrise - t) * 60.0);
	if (m < 10) minute = "0" + m; else minute = m;
	if (t < 10) hour = "0" + t; else hour = t;
	document.theForm.outputSunrise.value = hour + ":" + minute;

	// Output sunset time.
	t = Math.floor(fSunset);
	m = Math.floor((fSunset - t) * 60.0);
	if (m < 10) minute = "0" + m; else minute = m;
	if (t < 10) hour = "0" + t; else hour = t;
	document.theForm.outputSunset.value = hour + ":" + minute;*/

	return out;	

	}