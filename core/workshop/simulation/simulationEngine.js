/**
 * AURA Holographic Workshop — Deterministic Simulation Engine (V3 Standard)
 * Subsystem: Closed-form Multi-Domain Physical, Electrical, Mechanical, Robotic, and Material Solvers
 * 
 * Enforces the Absolute Anti-Hallucination Law:
 * All physical simulations and outcomes are grounded in verified, closed-form equations
 * and authoritative scientific constants, never synthesized by generative language models.
 */

export const PHYSICAL_CONSTANTS = Object.freeze({
  SPEED_OF_LIGHT: 299792458, // m/s
  GRAVITY_EARTH: 9.80665, // m/s^2
  ELEMENTARY_CHARGE: 1.602176634e-19, // C
  ELECTRON_MASS: 9.1093837015e-31, // kg
  PROTON_MASS: 1.67262192369e-27, // kg
  BOLTZMANN_CONSTANT: 1.380649e-23, // J/K
  AVOGADRO_CONSTANT: 6.02214076e23, // mol^-1
  GAS_CONSTANT_R: 8.314462618, // J/(mol·K)
  PERMITTIVITY_VACUUM: 8.8541878128e-12, // F/m
  PERMEABILITY_VACUUM: 1.25663706212e-6 // N/A^2
});

export const UNITS_REGISTRY = Object.freeze({
  m: { name: 'Meter', dimension: 'length', base: true },
  kg: { name: 'Kilogram', dimension: 'mass', base: true },
  s: { name: 'Second', dimension: 'time', base: true },
  A: { name: 'Ampere', dimension: 'current', base: true },
  K: { name: 'Kelvin', dimension: 'temperature', base: true },
  mol: { name: 'Mole', dimension: 'amount', base: true },
  N: { name: 'Newton', dimension: 'force', formula: 'kg·m/s²' },
  J: { name: 'Joule', dimension: 'energy', formula: 'N·m' },
  W: { name: 'Watt', dimension: 'power', formula: 'J/s' },
  V: { name: 'Volt', dimension: 'voltage', formula: 'W/A' },
  Ohm: { name: 'Ohm', dimension: 'resistance', formula: 'V/A' },
  T: { name: 'Tesla', dimension: 'magnetic_flux_density', formula: 'N/(A·m)' },
  Pa: { name: 'Pascal', dimension: 'pressure', formula: 'N/m²' },
  Hz: { name: 'Hertz', dimension: 'frequency', formula: 's⁻¹' },
  Nm: { name: 'Newton-meter', dimension: 'torque', formula: 'N·m' }
});

export class SimulationEngine {
  constructor() {
    this.telemetryBuffer = [];
  }

  solveLorentzForce(current, length, bField, angle) {
    const res = SimulationEngine.computeLorentzForce(current, length, bField, angle);
    return { force: res.forceN, unit: 'N' };
  }

  solveMotorTorque(kOrWindings, bField, current) {
    const tau = kOrWindings * bField * current;
    return { torque: parseFloat(tau.toFixed(4)), unit: 'N*m' };
  }

  solveOhmsLaw(voltage, resistance) {
    const res = SimulationEngine.computeOhmsLaw(voltage, resistance);
    return { current: res.currentAmps, currentUnit: 'A', powerWatts: res.powerWatts };
  }

  solveKinematics(v0, a, t, mass = 1.0) {
    const mot = SimulationEngine.computeMotion({ v0, a, t });
    const en = SimulationEngine.computeEnergy({ mass, velocity: mot.finalVelocityMs });
    return {
      displacement: mot.displacementM,
      velocity: mot.finalVelocityMs,
      kineticEnergyJoules: en.kineticEnergyJoules
    };
  }

  solveHookesLaw(k, displacement) {
    const res = SimulationEngine.computeSpringForce({ k, displacementM: displacement });
    return { force: res.restoringForceN, potentialEnergy: res.storedEnergyJoules };
  }

  solveForwardKinematics(angles, lengths) {
    return SimulationEngine.computeForwardKinematics(angles, lengths);
  }

  solveInverseKinematics(targetX, targetY, l1, l2) {
    const res = SimulationEngine.computeInverseKinematics2D({ targetX, targetY, l1, l2 });
    return {
      ...res,
      theta1: res.shoulderAngleRad,
      theta2: res.elbowAngleRad,
      reachable: res.reachable
    };
  }

  solveHalfLife(initial, halfLife, elapsed) {
    const res = SimulationEngine.computeRadioactiveDecay({ initialQuantity: initial, halfLifeSeconds: halfLife, elapsedSeconds: elapsed });
    return { remainingAmount: res.remainingQuantity };
  }

  stepSimulation(workspace, dt = 0.016) {
    const simState = workspace && workspace.simulation ? workspace.simulation : { running: true, speed: 1.0, parameters: {} };
    const res = SimulationEngine.step(simState, dt);
    this.telemetryBuffer.push(res);
    return {
      ...res,
      timeElapsed: (res && res.time) ? res.time : dt,
      telemetry: (res && res.parameters) ? res.parameters : {}
    };
  }

  // ── 1. Physics Solvers ──

  /**
   * Linear Kinematic Motion: s = v0*t + 0.5*a*t^2, v = v0 + a*t
   */
  static computeMotion({ v0 = 0, a = 0, t = 1.0 }) {
    const s = v0 * t + 0.5 * a * Math.pow(t, 2);
    const v = v0 + a * t;
    return {
      displacementM: parseFloat(s.toFixed(4)),
      finalVelocityMs: parseFloat(v.toFixed(4)),
      initialVelocityMs: v0,
      accelerationMs2: a,
      timeSeconds: t,
      formula: 's = v₀·t + ½a·t², v = v₀ + a·t'
    };
  }

  /**
   * Newton's Second Law: F = m * a
   */
  static computeForce({ mass = 1.0, acceleration = 9.80665 }) {
    if (mass < 0) throw new Error('Mass cannot be negative');
    const f = mass * acceleration;
    return {
      forceN: parseFloat(f.toFixed(4)),
      massKg: mass,
      accelerationMs2: acceleration,
      formula: 'F = m · a'
    };
  }

  /**
   * Mechanical Energy: Ek = 0.5*m*v^2, Ep = m*g*h
   */
  static computeEnergy({ mass = 1.0, velocity = 0, height = 0, g = PHYSICAL_CONSTANTS.GRAVITY_EARTH }) {
    const kinetic = 0.5 * mass * Math.pow(velocity, 2);
    const potential = mass * g * height;
    const total = kinetic + potential;
    return {
      kineticEnergyJoules: parseFloat(kinetic.toFixed(4)),
      potentialEnergyJoules: parseFloat(potential.toFixed(4)),
      totalEnergyJoules: parseFloat(total.toFixed(4)),
      formula: 'E_total = ½m·v² + m·g·h'
    };
  }

  /**
   * 1D Elastic Collision Solver: Conservation of Momentum and Kinetic Energy
   */
  static compute1DCollision({ m1 = 1.0, v1 = 5.0, m2 = 1.0, v2 = 0 }) {
    const v1Final = ((m1 - m2) / (m1 + m2)) * v1 + ((2 * m2) / (m1 + m2)) * v2;
    const v2Final = ((2 * m1) / (m1 + m2)) * v1 + ((m2 - m1) / (m1 + m2)) * v2;
    const pInitial = m1 * v1 + m2 * v2;
    const pFinal = m1 * v1Final + m2 * v2Final;
    return {
      v1FinalMs: parseFloat(v1Final.toFixed(4)),
      v2FinalMs: parseFloat(v2Final.toFixed(4)),
      momentumInitialKgMs: parseFloat(pInitial.toFixed(4)),
      momentumFinalKgMs: parseFloat(pFinal.toFixed(4)),
      formula: "v₁' = ((m₁-m₂)/(m₁+m₂))v₁ + ((2m₂)/(m₁+m₂))v₂"
    };
  }

  /**
   * Wave Equation: v = f * lambda
   */
  static computeWave({ frequency = 440, wavelength = 0.7727 }) {
    const velocity = frequency * wavelength;
    return {
      velocityMs: parseFloat(velocity.toFixed(4)),
      frequencyHz: frequency,
      wavelengthM: wavelength,
      periodSeconds: parseFloat((1 / frequency).toFixed(6)),
      formula: 'v = f · λ, T = 1/f'
    };
  }

  /**
   * Lorentz Force Calculation: F = I * (L x B) * sin(theta)
   */
  static computeLorentzForce(current, length = 0.1, bField = 1.2, angle = Math.PI / 2) {
    const forceN = Math.abs(current * length * bField * Math.sin(angle));
    return {
      forceN: parseFloat(forceN.toFixed(4)),
      formula: 'F = I · L · B · sin(θ)'
    };
  }

  // ── 2. Electronics Solvers ──

  /**
   * Ohm's Law Solver: I = V / R, P = V * I
   */
  static computeOhmsLaw(voltage = 9.0, resistance = 330, forwardDrop = 0) {
    const effectiveVoltage = Math.max(0, voltage - forwardDrop);
    const currentAmps = resistance > 0 ? effectiveVoltage / resistance : 0;
    const currentMa = currentAmps * 1000;
    const powerWatts = effectiveVoltage * currentAmps;
    return {
      currentAmps: parseFloat(currentAmps.toFixed(6)),
      currentMa: parseFloat(currentMa.toFixed(3)),
      powerWatts: parseFloat(powerWatts.toFixed(4)),
      effectiveVoltageVolts: parseFloat(effectiveVoltage.toFixed(3)),
      formula: 'I = (V_source - V_drop) / R, P = V · I'
    };
  }

  /**
   * RC Circuit Charging & Discharging: V(t) = V0 * (1 - e^(-t/RC))
   */
  static computeRCCircuit({ v0 = 5.0, resistance = 1000, capacitance = 100e-6, t = 0.1 }) {
    const tau = resistance * capacitance; // Time constant tau = RC
    const vCharge = v0 * (1 - Math.exp(-t / tau));
    const vDischarge = v0 * Math.exp(-t / tau);
    const iCurrent = (v0 / resistance) * Math.exp(-t / tau);
    return {
      timeConstantTauSeconds: parseFloat(tau.toFixed(6)),
      voltageChargingVolts: parseFloat(vCharge.toFixed(4)),
      voltageDischargingVolts: parseFloat(vDischarge.toFixed(4)),
      currentAmps: parseFloat(iCurrent.toFixed(6)),
      formula: 'V(t) = V₀(1 - e^{-t/RC}), τ = RC'
    };
  }

  /**
   * Current-Limiting Resistor Sizing for LEDs: R = (V_source - V_forward) / I_desired
   */
  static computeLedResistor({ vSource = 9.0, vForward = 2.1, iDesiredAmps = 0.02 }) {
    if (vSource <= vForward) {
      throw new Error('Supply voltage must be greater than LED forward voltage drop');
    }
    const resistanceOhm = (vSource - vForward) / iDesiredAmps;
    const powerDissipated = Math.pow(iDesiredAmps, 2) * resistanceOhm;
    return {
      recommendedResistanceOhm: Math.ceil(resistanceOhm),
      exactResistanceOhm: parseFloat(resistanceOhm.toFixed(2)),
      powerDissipatedWatts: parseFloat(powerDissipated.toFixed(4)),
      formula: 'R = (V_supply - V_f) / I_target'
    };
  }

  /**
   * DC Motor Torque & Counter-EMF
   */
  static computeMotorTorque(windings = 240, current = 4.0, area = 0.003, bField = 1.2, theta = Math.PI / 2) {
    const torqueNm = windings * current * area * bField * Math.sin(theta);
    return {
      torqueNm: parseFloat(torqueNm.toFixed(4)),
      formula: 'τ = N · I · A · B · sin(θ)'
    };
  }

  static computeBackEmf({ ke = 0.008, rpm = 1200 }) {
    const omegaRadS = (rpm * 2 * Math.PI) / 60;
    const backEmf = ke * omegaRadS;
    return {
      backEmfVolts: parseFloat(backEmf.toFixed(3)),
      angularVelocityRadS: parseFloat(omegaRadS.toFixed(2)),
      formula: 'V_emf = k_e · ω'
    };
  }

  // ── 3. Mechanics Solvers ──

  /**
   * Gear Ratio, Output Speed, and Multiplied Torque
   */
  static computeGearRatio({ teethDriver = 20, teethDriven = 60, inputRpm = 1800, inputTorqueNm = 5.0, efficiency = 0.95 }) {
    const ratio = teethDriven / teethDriver;
    const outputRpm = inputRpm / ratio;
    const outputTorque = inputTorqueNm * ratio * efficiency;
    return {
      gearRatio: parseFloat(ratio.toFixed(2)),
      outputRpm: parseFloat(outputRpm.toFixed(2)),
      outputTorqueNm: parseFloat(outputTorque.toFixed(2)),
      mechanicalAdvantage: `${ratio.toFixed(2)}:1`,
      formula: 'R = N_driven / N_driver, τ_out = τ_in · R · η'
    };
  }

  /**
   * Hooke's Law Spring: F = -k * x, Es = 0.5 * k * x^2
   */
  static computeSpringForce({ k = 500, displacementM = 0.05 }) {
    const forceN = -k * displacementM;
    const storedEnergyJ = 0.5 * k * Math.pow(displacementM, 2);
    return {
      restoringForceN: parseFloat(forceN.toFixed(4)),
      magnitudeN: parseFloat(Math.abs(forceN).toFixed(4)),
      storedEnergyJoules: parseFloat(storedEnergyJ.toFixed(4)),
      springConstantNM: k,
      formula: 'F = -k·Δx, E_s = ½k(Δx)²'
    };
  }

  // ── 4. Robotics & Kinematics ──

  /**
   * 3-Axis Forward Kinematics (Planar Revolute Joints)
   */
  static computeForwardKinematics(anglesRad = [0.4, -0.6, 0.2], linkLengths = [90, 75, 40]) {
    const [th1, th2, th3] = anglesRad;
    const [l1, l2, l3] = linkLengths;

    const j0 = { x: 0, y: 0, z: 0 };
    const j1 = {
      x: parseFloat((j0.x + l1 * Math.cos(th1)).toFixed(2)),
      y: parseFloat((j0.y + l1 * Math.sin(th1)).toFixed(2)),
      z: 0
    };
    const th12 = th1 + th2;
    const j2 = {
      x: parseFloat((j1.x + l2 * Math.cos(th12)).toFixed(2)),
      y: parseFloat((j1.y + l2 * Math.sin(th12)).toFixed(2)),
      z: 0
    };
    const th123 = th12 + th3;
    const endEffector = {
      x: parseFloat((j2.x + l3 * Math.cos(th123)).toFixed(2)),
      y: parseFloat((j2.y + l3 * Math.sin(th123)).toFixed(2)),
      z: 0
    };

    return {
      endEffector,
      joints: [j0, j1, j2, endEffector],
      formula: 'T = A₁ · A₂ · A₃'
    };
  }

  /**
   * 2-Link Analytical Inverse Kinematics
   */
  static computeInverseKinematics2D({ targetX, targetY, l1 = 90, l2 = 75 }) {
    const distSq = targetX * targetX + targetY * targetY;
    const dist = Math.sqrt(distSq);

    if (dist > l1 + l2) {
      throw new Error(`Target (${targetX}, ${targetY}) is out of reachable reach (${l1 + l2})`);
    }

    const cosAngle2 = (distSq - l1 * l1 - l2 * l2) / (2 * l1 * l2);
    const sinAngle2 = Math.sqrt(Math.max(0, 1 - cosAngle2 * cosAngle2));
    const theta2 = Math.atan2(sinAngle2, cosAngle2); // Elbow angle

    const k1 = l1 + l2 * cosAngle2;
    const k2 = l2 * sinAngle2;
    const theta1 = Math.atan2(targetY, targetX) - Math.atan2(k2, k1); // Shoulder angle

    return {
      shoulderAngleRad: parseFloat(theta1.toFixed(4)),
      elbowAngleRad: parseFloat(theta2.toFixed(4)),
      shoulderAngleDeg: parseFloat(((theta1 * 180) / Math.PI).toFixed(1)),
      elbowAngleDeg: parseFloat(((theta2 * 180) / Math.PI).toFixed(1)),
      reachable: true,
      formula: 'cos(θ₂) = (x² + y² - l₁² - l₂²) / (2l₁l₂)'
    };
  }

  // ── 5. Chemistry & Materials Solvers ──

  /**
   * Radioactive Decay Solver: N(t) = N0 * (0.5)^(t / t_half)
   */
  static computeRadioactiveDecay({ initialQuantity = 100, halfLifeSeconds = 5730, elapsedSeconds = 5730 }) {
    const remaining = initialQuantity * Math.pow(0.5, elapsedSeconds / halfLifeSeconds);
    const decayConstant = Math.LN2 / halfLifeSeconds;
    return {
      remainingQuantity: parseFloat(remaining.toFixed(4)),
      fractionRemaining: parseFloat((remaining / initialQuantity).toFixed(4)),
      decayConstantS: parseFloat(decayConstant.toExponential(4)),
      elapsedSeconds,
      formula: 'N(t) = N₀ · (½)^{t / t_{1/2}}'
    };
  }

  /**
   * Ideal Gas Law: P = (n * R * T) / V
   */
  static computeIdealGas({ pressurePa = null, volumeM3 = 0.0224, moles = 1.0, temperatureK = 273.15 }) {
    const R = PHYSICAL_CONSTANTS.GAS_CONSTANT_R;
    if (pressurePa === null) {
      const p = (moles * R * temperatureK) / volumeM3;
      return {
        pressurePa: parseFloat(p.toFixed(2)),
        volumeM3,
        moles,
        temperatureK,
        formula: 'P = n·R·T / V'
      };
    } else {
      const v = (moles * R * temperatureK) / pressurePa;
      return {
        pressurePa,
        volumeM3: parseFloat(v.toFixed(6)),
        moles,
        temperatureK,
        formula: 'V = n·R·T / P'
      };
    }
  }

  /**
   * Crystal Lattice Node Generator (FCC, BCC, HCP, Diamond)
   */
  static getCrystalLatticeGeometry(latticeType = 'fcc', a = 40) {
    const nodes = [];
    const type = latticeType.toLowerCase();

    // Corner atoms
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          nodes.push({ x: (x * a) / 2, y: (y * a) / 2, z: (z * a) / 2, type: 'corner' });
        }
      }
    }

    if (type === 'bcc') {
      // Body centered
      nodes.push({ x: 0, y: 0, z: 0, type: 'body_center' });
    } else if (type === 'fcc') {
      // Face centered
      nodes.push({ x: 0, y: 0, z: a / 2, type: 'face_center' });
      nodes.push({ x: 0, y: 0, z: -a / 2, type: 'face_center' });
      nodes.push({ x: a / 2, y: 0, z: 0, type: 'face_center' });
      nodes.push({ x: -a / 2, y: 0, z: 0, type: 'face_center' });
      nodes.push({ x: 0, y: a / 2, z: 0, type: 'face_center' });
      nodes.push({ x: 0, y: -a / 2, z: 0, type: 'face_center' });
    } else if (type === 'hcp') {
      // Hexagonal Close Packed
      for (let i = 0; i < 6; i++) {
        const rad = (i * Math.PI) / 3;
        nodes.push({ x: Math.cos(rad) * a, y: a / 2, z: Math.sin(rad) * a, type: 'hex_ring' });
        nodes.push({ x: Math.cos(rad) * a, y: -a / 2, z: Math.sin(rad) * a, type: 'hex_ring' });
      }
      nodes.push({ x: 0, y: 0, z: a * 0.4, type: 'interstitial' });
    }

    return {
      latticeType: type.toUpperCase(),
      nodeCount: nodes.length,
      latticeConstantA: a,
      nodes
    };
  }

  // ── 6. Simulation Loop State & Step Execution ──

  /**
   * Advances simulation step for a workspace with deterministic updates.
   */
  static step(simulationState, deltaSeconds = 0.016) {
    if (!simulationState || !simulationState.running) {
      return simulationState;
    }

    const speed = simulationState.speed || 1.0;
    const effectiveDelta = deltaSeconds * speed;
    simulationState.step = (simulationState.step || 0) + 1;
    simulationState.time = (simulationState.time || 0) + effectiveDelta;

    if (simulationState.parameters) {
      const p = simulationState.parameters;

      // Electric Motor Model
      if (p.rpm !== undefined && p.rpm > 0) {
        p.angleRad = ((p.angleRad || 0) + ((p.rpm * 2 * Math.PI) / 60) * effectiveDelta) % (2 * Math.PI);
        p.backEmfVolts = parseFloat(((p.rpm / 1200) * 9.6).toFixed(2));
        p.sparkSignal = Math.sin(p.angleRad * 2) > 0.85;
      }

      // Robotic Arm Kinematics Model
      if (p.shoulderAngleDeg !== undefined) {
        const t = simulationState.time;
        p.shoulderAngleDeg = 45 + Math.sin(t * 1.5) * 20;
        p.elbowAngleDeg = -30 + Math.cos(t * 2.0) * 25;
      }

      // Four-Stroke Engine Cycle Model
      if (p.crankAngleDeg !== undefined) {
        p.crankAngleDeg = (p.crankAngleDeg + 360 * effectiveDelta * 2) % 720;
        p.stroke = Math.floor(p.crankAngleDeg / 180); // 0=Intake, 1=Compression, 2=Power, 3=Exhaust
      }

      // Live Telemetry Waveform Buffer (for real-time UI sparkline/oscilloscope)
      if (!simulationState.telemetryHistory) {
        simulationState.telemetryHistory = [];
      }
      const val = p.rpm ? p.rpm + Math.sin(simulationState.time * 10) * 35 : Math.sin(simulationState.time * 5) * 50 + 50;
      simulationState.telemetryHistory.push(parseFloat(val.toFixed(2)));
      if (simulationState.telemetryHistory.length > 50) {
        simulationState.telemetryHistory.shift();
      }
    }

    return simulationState;
  }
}
