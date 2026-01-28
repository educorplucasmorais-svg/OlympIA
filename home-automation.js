// home-automation.js
// Integração com Home Assistant via API REST
// Controla luzes, sonos, sensores e automações

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const HOME_ASSISTANT_URL = process.env.HOME_ASSISTANT_TOKEN ? process.env.HOME_ASSISTANT_URL : null;
const HOME_ASSISTANT_TOKEN = process.env.HOME_ASSISTANT_TOKEN;

class HomeAutomation {
  constructor() {
    this.baseURL = HOME_ASSISTANT_URL;
    this.token = HOME_ASSISTANT_TOKEN;
    this.client = null;

    if (this.baseURL && this.token) {
      this.client = axios.create({
        baseURL: this.baseURL,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  // Verifica se Home Assistant está configurado
  isConfigured() {
    return this.client !== null;
  }

  // Ligar/desligar luzes
  async toggleLight(entityId, state = 'toggle') {
    if (!this.isConfigured()) {
      return { error: '⚠️ Home Assistant não configurado. Configure HOME_ASSISTANT_URL e HOME_ASSISTANT_TOKEN no .env' };
    }

    try {
      const domain = state === 'toggle' ? 'light' : 'light';
      const service = state === 'toggle' ? 'toggle' : (state === 'on' ? 'turn_on' : 'turn_off');

      const response = await this.client.post(`/api/services/${domain}/${service}`, {
        entity_id: entityId
      });

      return {
        success: true,
        message: `💡 ${entityId}: ${service === 'toggle' ? 'alternado' : state}`,
        data: response.data
      };
    } catch (error) {
      return {
        error: `❌ Erro ao controlar luz: ${error.message}`
      };
    }
  }

  // Ativar uma cena
  async activateScene(sceneName) {
    if (!this.isConfigured()) {
      return { error: '⚠️ Home Assistant não configurado' };
    }

    try {
      const response = await this.client.post('/api/services/scene/turn_on', {
        entity_id: `scene.${sceneName}`
      });

      return {
        success: true,
        message: `🎬 Cena ativada: ${sceneName}`,
        data: response.data
      };
    } catch (error) {
      return {
        error: `❌ Erro ao ativar cena: ${error.message}`
      };
    }
  }

  // Obter status de um sensor
  async getSensorStatus(entityId) {
    if (!this.isConfigured()) {
      return { error: '⚠️ Home Assistant não configurado' };
    }

    try {
      const response = await this.client.get(`/api/states/${entityId}`);
      const state = response.data;

      return {
        success: true,
        entity: entityId,
        value: state.state,
        unit: state.attributes?.unit_of_measurement || '',
        friendlyName: state.attributes?.friendly_name || entityId,
        lastUpdated: state.last_updated
      };
    } catch (error) {
      return {
        error: `❌ Sensor não encontrado: ${entityId}`
      };
    }
  }

  // Listar todos os dispositivos disponíveis
  async listDevices() {
    if (!this.isConfigured()) {
      return { error: '⚠️ Home Assistant não configurado' };
    }

    try {
      const response = await this.client.get('/api/states');
      const states = response.data;

      // Agrupar por tipo de dispositivo
      const devices = {
        lights: [],
        switches: [],
        sensors: [],
        media_players: [],
        climate: [],
        covers: [],
        cameras: [],
        other: []
      };

      states.forEach(state => {
        const [domain] = state.entity_id.split('.');
        const item = {
          entityId: state.entity_id,
          name: state.attributes?.friendly_name || state.entity_id,
          state: state.state
        };

        if (domain === 'light') devices.lights.push(item);
        else if (domain === 'switch') devices.switches.push(item);
        else if (domain === 'sensor') devices.sensors.push(item);
        else if (domain === 'media_player') devices.media_players.push(item);
        else if (domain === 'climate') devices.climate.push(item);
        else if (domain === 'cover') devices.covers.push(item);
        else if (domain === 'camera') devices.cameras.push(item);
        else devices.other.push(item);
      });

      return {
        success: true,
        devices,
        total: states.length
      };
    } catch (error) {
      return {
        error: `❌ Erro ao listar dispositivos: ${error.message}`
      };
    }
  }

  // Controlar volume (Sonos, speakers)
  async setVolume(mediaPlayerId, volume) {
    if (!this.isConfigured()) {
      return { error: '⚠️ Home Assistant não configurado' };
    }

    if (volume < 0 || volume > 100) {
      return { error: '❌ Volume deve estar entre 0 e 100' };
    }

    try {
      const response = await this.client.post(`/api/services/media_player/volume_set`, {
        entity_id: mediaPlayerId,
        volume_level: volume / 100
      });

      return {
        success: true,
        message: `🔊 Volume de ${mediaPlayerId}: ${volume}%`,
        data: response.data
      };
    } catch (error) {
      return {
        error: `❌ Erro ao ajustar volume: ${error.message}`
      };
    }
  }

  // Reproduzir mídia
  async playMedia(mediaPlayerId, mediaContent) {
    if (!this.isConfigured()) {
      return { error: '⚠️ Home Assistant não configurado' };
    }

    try {
      const response = await this.client.post(`/api/services/media_player/play_media`, {
        entity_id: mediaPlayerId,
        media_content_id: mediaContent,
        media_content_type: 'music'
      });

      return {
        success: true,
        message: `🎵 Reproduzindo em ${mediaPlayerId}`,
        data: response.data
      };
    } catch (error) {
      return {
        error: `❌ Erro ao reproduzir mídia: ${error.message}`
      };
    }
  }

  // Executar automação/script
  async runAutomation(automationId) {
    if (!this.isConfigured()) {
      return { error: '⚠️ Home Assistant não configurado' };
    }

    try {
      const response = await this.client.post(`/api/services/automation/trigger`, {
        entity_id: `automation.${automationId}`
      });

      return {
        success: true,
        message: `⚡ Automação acionada: ${automationId}`,
        data: response.data
      };
    } catch (error) {
      return {
        error: `❌ Erro ao acionar automação: ${error.message}`
      };
    }
  }

  // Template para fácil parsing de comandos
  parseCommand(command) {
    // Exemplos:
    // "ligar sala" → { action: 'toggle', device: 'light.sala' }
    // "desligar quarto" → { action: 'off', device: 'light.quarto' }
    // "cena cinema" → { action: 'scene', device: 'cinema' }
    // "volume sonos 50" → { action: 'volume', device: 'media_player.sonos', value: 50 }

    const parts = command.toLowerCase().trim().split(/\s+/);
    
    if (parts[0] === 'ligar' && parts[1]) {
      return { action: 'on', device: `light.${parts[1]}` };
    } else if (parts[0] === 'desligar' && parts[1]) {
      return { action: 'off', device: `light.${parts[1]}` };
    } else if (parts[0] === 'alternar' && parts[1]) {
      return { action: 'toggle', device: `light.${parts[1]}` };
    } else if (parts[0] === 'cena' && parts[1]) {
      return { action: 'scene', device: parts[1] };
    } else if (parts[0] === 'volume' && parts[1] && parts[2]) {
      return { action: 'volume', device: `media_player.${parts[1]}`, value: parseInt(parts[2]) };
    } else if (parts[0] === 'sensor' && parts[1]) {
      return { action: 'sensor', device: `sensor.${parts[1]}` };
    } else if (parts[0] === 'automacao' && parts[1]) {
      return { action: 'automation', device: parts[1] };
    } else {
      return { error: '❌ Comando não reconhecido. Use: ligar, desligar, cena, volume, sensor, automacao' };
    }
  }

  // Executar comando parseado
  async executeCommand(parsedCommand) {
    if (parsedCommand.error) return parsedCommand;

    try {
      if (parsedCommand.action === 'on') {
        return await this.toggleLight(parsedCommand.device, 'on');
      } else if (parsedCommand.action === 'off') {
        return await this.toggleLight(parsedCommand.device, 'off');
      } else if (parsedCommand.action === 'toggle') {
        return await this.toggleLight(parsedCommand.device, 'toggle');
      } else if (parsedCommand.action === 'scene') {
        return await this.activateScene(parsedCommand.device);
      } else if (parsedCommand.action === 'volume') {
        return await this.setVolume(parsedCommand.device, parsedCommand.value);
      } else if (parsedCommand.action === 'sensor') {
        return await this.getSensorStatus(parsedCommand.device);
      } else if (parsedCommand.action === 'automation') {
        return await this.runAutomation(parsedCommand.device);
      }
    } catch (error) {
      return { error: `❌ Erro: ${error.message}` };
    }
  }
}

export default new HomeAutomation();
