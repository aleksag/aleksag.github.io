include <Round-Anything/polyround.scad>
//https://github.com/Irev-Dev/Round-Anything/discussions/21

polygon(polyRound([
  [0, 0, 0],
  [10,0, 1],
  [0, 10,0]
],10));

cylinder(h=15.31,r=20.95/2,$fn=100,center=true);