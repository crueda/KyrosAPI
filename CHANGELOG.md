# Registro de cambios
Todos los cambios importantes realizados en este proyecto será documentado en este fichero

## [2.0.0] - 2016-11-04
### Funcionalidades añadidas
- Busqueda de dispositivos cercanos:
	- Se permite la busqueda de dispositivos cercanos desde un punto del mapa.
- Busqueda de puntos de interes (PDI) cercanos:
	- Se permite la busqueda de PDIs cercanos desde un punto del mapa.
- Últimas posiciones:
	- Lista de ultimos dispositivos que han enviado posición.
- Gestión de eventos:
	- Se muestran los eventos, tanto en tioempo real como en histórico.
	- Ventana detallada de eventos, pulsando sobre el icono de algún evento.

### Mejoras y funcionalidades menores
- Acesso a histórico desde el tooltip.

## [1.1.0] - 2016-10-30
### Funcionalidades añadidas
- Icono para disositivo:
	- Se permite la selección de un icono para el dispositivo.
	- Si el dispositivo no dispone de icono, se mostrará con el mismo icono usado en Kyros
- Tooltip mejorado
	- Organización de la información del tooltip en pestañas.
- Eventos de tracking
	- Se muestran los posibles eventos, tanto en tiempo real como en consultas de histórico.
- Opción de búsqueda de dispositivo (en menú principal).
- Compartir ubicación de un vehículo
	- Se envia link por correo electrónico que permite el seguimiento del vehículo durante las siguientes 24 horas.

### Mejoras y funcionalidades menores
- Eliminada precarga de iconos para evitar ralentizar las poticiones de usuario.

## [1.0.2] - 2016-09-30
### Funcionalidades añadidas
- Gráficas sobre los datos de historico:
	- Cuando se realiza una consulta de historico, aparece un boton de graficas abajo a la derecha.
	- Se ha experimentado con 2 gráficas más: distribución de los puntos de tracking y distribución de heading.
- Ficheros en mongodb
	- En el tooltip del dispositivo se muestra su imagen asociada.
	- Se permite subir una nueva imagen para el dispositivo.

## [1.0.1] - 2016-09-21
### Funcionalidades añadidas
- Todas las opciones en menú principal con acceso único.
- Árbol de dispositivos:
	- Al pulsar sobre el botón "Todos" aparece un arbol con todos los dispositivos que puede monitorizar el usuario. 
	- Se pueden seleccionar dispositivos y se mostraran sobre el mapa (su última posición).
- Colocar un punto sobre el mapa. Cuando se pulsa en el mapa se posiciones un punto naranja que permite abrir una nueva ventana popup (donde añadir futuras opciones como cercanía a POIs, a dispositivos, etc).

### Mejoras y funcionalidades menores
- Interfaz más limpia, eliminación de controles de mapa (especialmente en acceso móvil).
- Alojado en mongodb los datos de monitorización de dispositivos.
- Recolocación de controles de mapa (controles de zoom abajo a la izquierda).
- Añadido el campo fecha al pulsar sobre dispositivo.
- Efecto de caida en los puntos de tracking (consulta de histórico).
- Mensaje de aviso cuando no existe puntos de tracking (despues de consulta en histórico)

## 1.0.0 - 2016-09-19
### Funcionalides
- Login y control de sesión.
- i18n (español, ingles).
- Consulta de la última posicion de todos los dispositivos que puede monitorizar el usuario.
- Consulta del histórico de un dispositivo.
- Gráficos.
- Muestra los POIs que puede visualizar el usuario.
- Selección de dispositivo por defecto.
- Cartografía Google.
- Globo terraqueo.
- Configuración de la cuenta del usuario.
- Heatmaps y clustering de posiciones.

[1.1.0]: http://viewpre.kyroslbs.com/
[1.0.2]: http://viewpre.kyroslbs.com/
[1.0.1]: http://view.kyroslbs.com/