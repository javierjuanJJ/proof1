import { Command } from 'commander';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import chalk from 'chalk';
import { URL } from 'url';

const program = new Command();

program
  .name('link-mapper-pro')
  .description('Mapea enlaces desde parámetros o desde un archivo')
  .version('1.3.0')
  .argument('[urls...]', 'URLs de inicio pasadas por parámetro')
  .option('-f, --file <path>', 'Archivo de texto con lista de URLs (una por línea)')
  .option('-d, --depth <number>', 'Profundidad de navegación', '1')
  .option('-o, --output <filename>', 'Archivo de salida', 'mapeo_enlaces.json')
  .option('-X, --exclude-file <path>', 'Archivo de exclusiones', 'exclude.txt')
  .action(async (urlArgs, options) => {
    let semillas = [...urlArgs];

    // --- CARGAR DESDE ARCHIVO ---
    if (options.file) {
      if (fs.existsSync(options.file)) {
        const fileContent = fs.readFileSync(options.file, 'utf-8');
        const fileUrls = fileContent
          .split(/\r?\n/) // Dividir por líneas
          .map(line => line.trim())
          .filter(line => line.startsWith('http')); // Filtrar solo URLs válidas
        semillas = [...semillas, ...fileUrls];
        console.log(chalk.blue(`📂 Cargadas ${fileUrls.length} URLs desde el archivo.`));
      } else {
        console.error(chalk.red(`❌ El archivo ${options.file} no existe.`));
        process.exit(1);
      }
    }

    if (semillas.length === 0) {
      console.error(chalk.yellow('⚠️ No se proporcionaron URLs. Usa parámetros o la opción --file.'));
      process.exit(1);
    }

    const maxDepth = parseInt(options.depth);
    const visited = new Set();
    const map = {
      internal: new Set(),
      external: new Set(),
      errors: []
    };

    console.log(chalk.magenta.bold(`\n🕸️  Iniciando mapeo de ${semillas.length} semillas (Profundidad: ${maxDepth})...\n`));

    async function crawl(currentUrl, level) {
      if (visited.has(currentUrl) || level > maxDepth) return;
      visited.add(currentUrl);
      console.log(`${chalk.gray('  '.repeat(level))}📂 Explorando: ${chalk.blue(currentUrl)}`);

      try {
        const { data } = await axios.get(currentUrl, {
          timeout: 7000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        const $ = cheerio.load(data);
        const tasks = [];


        $('article a[href], section a[href], main a[href]').each((_, el) => {

          let href = $(el).attr('href');
          if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

          try {
            const absolute = new URL(href, currentUrl).href;


            // --- NUEVA LÓGICA DE FILTRADO TÉCNICO ---
            const urlObj = new URL(absolute);
            const pathname = urlObj.pathname; // Ejemplo: /noticias/titulo-largo-de-ejemplo
            const segments = pathname.split('/').filter(s => s.length > 0);
            const lastSegment = segments[segments.length - 1] || "";

            const endsWithHtml = pathname.toLowerCase().endsWith('.html');
            const hasLongSlug = lastSegment.length > 20;


            // Solo procedemos si cumple una de tus dos condiciones
            if (endsWithHtml || hasLongSlug) {
              // Clasificamos como interno si comparte la base de la GVA
              if (absolute.includes('hisenda.gva.es/auto/presupuestos/2025/')) {
                map.internal.add(absolute);
                if (level < maxDepth) {
                  tasks.push(crawl(absolute, level + 1));
                }
              } else {
                map.external.add(absolute);
              }

            }



          } catch (e) { /* URL inválida */ }
        });

        await Promise.all(tasks);

      } catch (error) {
        map.errors.push({ url: currentUrl, error: error.message });
        console.log(chalk.red(`${chalk.gray('  '.repeat(level))}⚠️ Error: ${error.message}`));
      }
    }

    // Procesar todas las semillas
    for (const startUrl of semillas) {
      await crawl(startUrl, 0);
    }





    // --- FILTRADO POST-PROCESADO: Excluir del JSON final ---
    console.log(chalk.yellow('\n🧹 Aplicando filtros de exclude.txt al resultado final...'));

    let excludedWords = [];
    if (fs.existsSync(options.excludeFile)) {
      excludedWords = fs.readFileSync(options.excludeFile, 'utf-8')
        .split(/\r?\n/)
        .map(line => line.trim().toLowerCase())
        .filter(line => line.length > 0 && !line.startsWith('#'));
      console.log(chalk.gray(`📝 Filtros cargados: ${excludedWords.length} palabras.`));
    }

    let includeWords = [];
    if (fs.existsSync(options.includeWords)) {
      includeWords = fs.readFileSync(options.excludeFile, 'utf-8')
        .split(/\r?\n/)
        .map(line => line.trim().toLowerCase())
        .filter(line => line.length > 0 && !line.startsWith('#'));
      console.log(chalk.gray(`📝 Filtros cargados: ${includeWords.length} palabras.`));
    }

    // Función que decide si una URL debe mantenerse o borrarse
    const filterFn = (url) => {
      const urlLower = url.toLowerCase();

      // Si la URL contiene CUALQUIERA de las palabras de la lista de exclusión, se elimina (false)
      return !excludedWords.some(word => urlLower.includes(word));

    };

    // Aplicamos el filtro a las listas recolectadas
    const cleanInternal = Array.from(map.internal).filter(filterFn).sort();
    const cleanExternal = Array.from(map.external).filter(filterFn).sort();







    // --- GUARDAR RESULTADOS ---
    const result = {
      meta: {
        fecha: new Date().toISOString(),
        config: { ...options, depth: maxDepth }
      },
      resumen: {
        total_capturado: map.internal.size + map.external.size,
        total_final_filtrado: cleanInternal.length + cleanExternal.length,
        enlaces_eliminados: (map.internal.size + map.external.size) - (cleanInternal.length + cleanExternal.length),
        errores_rastreo: map.errors.length
      },
      enlaces_internos: cleanInternal,
      enlaces_externos: cleanExternal,
      errores_detalle: map.errors
    };

    fs.writeFileSync(options.output, JSON.stringify(result, null, 2));

    console.log(chalk.green.bold(`\n✅ Proceso finalizado.`));
    console.log(`💾 Resultados en: ${chalk.cyan(options.output)}\n`);
  });

program.parse(process.argv);